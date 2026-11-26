import {audit} from "@/lib/security";
import {NextRequest,NextResponse} from "next/server";
import {requirePermission} from "@/lib/api";
import {rows,transaction} from "@/lib/db";
import {randomUUID} from "node:crypto";
import {hashPassword} from "@/lib/auth";
import {isSystemAdmin} from "@/lib/permissions";
import type {RowDataPacket} from "mysql2";
async function authorize(permission:string){
 const session=await requirePermission(permission);
 if(session.error||!session.userId)return null;
 return await isSystemAdmin(session.userId)?session.userId:null;
}
const json=(data:unknown,status=200)=>NextResponse.json(data,{status});
function sameOrigin(req:NextRequest){return req.headers.get("origin")===new URL(req.url).origin}
const scopes=[["brand","brands"],["company","companies"],["outlet","outlets"]] as const;
export async function GET(){
 const admin=await authorize("user.view");if(!admin)return json({error:"Forbidden"},403);
 const [users,roles,brands,companies,outlets,permissions,roleLinks,brandLinks,companyLinks,outletLinks,overrides]=await Promise.all([
 rows("SELECT u.id,u.email,COALESCE(p.full_name,u.full_name) AS full_name,(u.is_active=1 AND p.is_active=1) AS is_active FROM users u LEFT JOIN user_profiles p ON p.user_id=u.id ORDER BY u.created_at DESC"),
 rows("SELECT id,code,name FROM app_roles WHERE is_active=1 ORDER BY code"),
 rows("SELECT id,code,name FROM brands WHERE is_active=1 ORDER BY name"),
 rows("SELECT id,code,name,legal_name FROM companies WHERE is_active=1 ORDER BY name"),
 rows("SELECT id,code,name,company_id,brand_id FROM outlets WHERE is_active=1 ORDER BY name"),
 rows("SELECT id,code,name FROM app_permissions ORDER BY code"),
 rows("SELECT ur.user_id,ur.role_id,r.code FROM user_roles ur JOIN app_roles r ON r.id=ur.role_id"),
 rows("SELECT user_id,brand_id FROM user_brand_access"),
 rows("SELECT user_id,company_id FROM user_company_access"),
 rows("SELECT user_id,outlet_id FROM user_outlet_access"),
 rows("SELECT user_id,permission_id,effect FROM user_permissions")]);
 return json({admin,roles,brands,companies,outlets,permissions,users:users.map(u=>({...u,is_active:!!u.is_active,role_ids:roleLinks.filter(l=>l.user_id===u.id).map(l=>l.role_id),role_codes:roleLinks.filter(l=>l.user_id===u.id).map(l=>l.code),brand_ids:brandLinks.filter(l=>l.user_id===u.id).map(l=>l.brand_id),company_ids:companyLinks.filter(l=>l.user_id===u.id).map(l=>l.company_id),outlet_ids:outletLinks.filter(l=>l.user_id===u.id).map(l=>l.outlet_id),overrides:overrides.filter(l=>l.user_id===u.id).map(l=>({permission_id:l.permission_id,effect:l.effect}))}))});
}
function parseAccess(b:any){
 if(!b||typeof b!=="object"||typeof b.role_id!=="string"||!b.role_id)return null;
 const result:Record<string,string[]>={};
 for(const [key] of scopes){const a=b[key+"_ids"];if(!Array.isArray(a)||a.length>1000||a.some(x=>typeof x!=="string"||x.length>36))return null;result[key]=[...new Set<string>(a)];}
 if(!Array.isArray(b.overrides)||b.overrides.length>1000||b.overrides.some((o:any)=>!o||typeof o.permission_id!=="string"||o.permission_id.length>36||!["ALLOW","DENY"].includes(o.effect)))return null;
 if(new Set(b.overrides.map((o:any)=>o.permission_id)).size!==b.overrides.length)return null;
 return {role:b.role_id as string,scopes:result,overrides:b.overrides as {permission_id:string;effect:string}[]};
}
type Access=NonNullable<ReturnType<typeof parseAccess>>;
class Invalid extends Error{}
async function applyAccess(c:import("mysql2/promise").PoolConnection,id:string,a:Access){
 const [roles]=await c.execute<RowDataPacket[]>("SELECT code FROM app_roles WHERE id=? AND is_active=1",[a.role]);if(!roles.length||roles[0].code==="SUPER_ADMIN")throw new Invalid("Pilih role aktif selain SUPER_ADMIN.");
 for(const [key,table] of scopes){for(const value of a.scopes[key]){const [found]=await c.execute<RowDataPacket[]>("SELECT id FROM "+table+" WHERE id=? AND is_active=1",[value]);if(!found.length)throw new Invalid("Cakupan organisasi tidak valid.");}}
 for(const outlet of a.scopes.outlet){const [found]=await c.execute<RowDataPacket[]>("SELECT company_id,brand_id FROM outlets WHERE id=?",[outlet]);if(!a.scopes.company.includes(found[0].company_id)||!a.scopes.brand.includes(found[0].brand_id))throw new Invalid("Pilih brand dan CV untuk setiap outlet.");}
 await c.execute("DELETE FROM user_roles WHERE user_id=?",[id]);await c.execute("INSERT INTO user_roles(id,user_id,role_id) VALUES (?,?,?)",[randomUUID(),id,a.role]);
 for(const [key] of scopes){await c.execute("DELETE FROM user_"+key+"_access WHERE user_id=?",[id]);for(const value of a.scopes[key])await c.execute("INSERT INTO user_"+key+"_access(id,user_id,"+key+"_id) VALUES (?,?,?)",[randomUUID(),id,value]);}
 await c.execute("DELETE FROM user_permissions WHERE user_id=?",[id]);for(const o of a.overrides){const [p]=await c.execute<RowDataPacket[]>("SELECT id FROM app_permissions WHERE id=?",[o.permission_id]);if(!p.length)throw new Invalid("Permission tidak valid.");await c.execute("INSERT INTO user_permissions(id,user_id,permission_id,effect) VALUES (?,?,?,?)",[randomUUID(),id,o.permission_id,o.effect]);}
}
export async function POST(req:NextRequest){
 const admin=await authorize("user.create");if(!sameOrigin(req)||!admin)return json({error:"Forbidden"},403);
 const b=await req.json().catch(()=>null),a=parseAccess(b);
 if(!a||typeof b.email!=="string"||typeof b.full_name!=="string"||typeof b.password!=="string")return json({error:"Data akun atau akses tidak valid."},400);
 const email=b.email.trim().toLowerCase(),name=b.full_name.trim(),password=b.password;
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>255||!name||name.length>100||Buffer.byteLength(password)<12||Buffer.byteLength(password)>72)return json({error:"Isi nama, email valid, dan password 12–72 byte."},400);
 const id=randomUUID(),hash=await hashPassword(password);
 try{await transaction(async c=>{await c.execute("INSERT INTO users(id,email,password_hash,full_name) VALUES (?,?,?,?)",[id,email,hash,name]);await c.execute("INSERT INTO user_profiles(id,user_id,full_name) VALUES (?,?,?)",[randomUUID(),id,name]);await applyAccess(c,id,a);});await audit(admin,"user.create",id);return json({user:{id,email}},201)}catch(e){if(e instanceof Invalid)return json({error:e.message},400);if((e as {code?:string}).code==="ER_DUP_ENTRY")return json({error:"Email sudah terdaftar."},409);throw e;}
}
export async function PUT(req:NextRequest){
 const admin=await authorize("user.view");if(!sameOrigin(req)||!admin)return json({error:"Forbidden"},403);
 const b=await req.json().catch(()=>null),a=parseAccess(b);
 if(!a||typeof b.id!=="string"||b.id===admin||typeof b.is_active!=="boolean")return json({error:"Akun atau akses tidak valid. Akun sendiri tidak dapat diubah."},400);
 try{await transaction(async c=>{const [u]=await c.execute<RowDataPacket[]>("SELECT id FROM users WHERE id=? FOR UPDATE",[b.id]);if(!u.length)throw new Invalid("Akun tidak ditemukan.");const [protectedRoles]=await c.execute<RowDataPacket[]>("SELECT 1 FROM user_roles ur JOIN app_roles r ON r.id=ur.role_id WHERE ur.user_id=? AND r.code='SUPER_ADMIN'",[b.id]);if(protectedRoles.length)throw new Invalid("Akun SUPER_ADMIN dilindungi.");await applyAccess(c,b.id,a);await c.execute("UPDATE users SET is_active=? WHERE id=?",[b.is_active,b.id]);await c.execute("UPDATE user_profiles SET is_active=? WHERE user_id=?",[b.is_active,b.id]);});await audit(admin,"user.access.update",b.id);return json({ok:true})}catch(e){if(e instanceof Invalid)return json({error:e.message},400);throw e}
}
