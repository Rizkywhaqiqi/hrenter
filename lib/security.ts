import {createHash,randomUUID} from "node:crypto";
import {execute,transaction} from "./db";
import type {RowDataPacket} from "mysql2";
import {createConnection} from "mysql2/promise";
import {getDbOptions} from "./db-config.cjs";
function missing(e:unknown){return (e as {code?:string})?.code==="ER_NO_SUCH_TABLE";}
const local=new Map<string,{count:number;until:number}>();
function localLimit(key:string){const now=Date.now();for(const [k,v] of local)if(v.until<=now)local.delete(k);const v=local.get(key)||{count:0,until:now+600000};v.count++;if(local.size>=5000&&!local.has(key))return false;local.set(key,v);return v.count<=10;}
export async function reserveLogin(email:string,ip:string){
 const key=createHash("sha256").update(email.trim().toLowerCase()+"|"+ip).digest("hex");
 try{return await transaction(async c=>{
 await c.execute("INSERT INTO login_rate_limits(bucket,attempts,window_start) VALUES (?,1,UTC_TIMESTAMP()) ON DUPLICATE KEY UPDATE attempts=IF(window_start<=UTC_TIMESTAMP()-INTERVAL 10 MINUTE,1,attempts+1),window_start=IF(window_start<=UTC_TIMESTAMP()-INTERVAL 10 MINUTE,UTC_TIMESTAMP(),window_start)",[key]);
 const [r]=await c.execute<RowDataPacket[]>("SELECT attempts FROM login_rate_limits WHERE bucket=?",[key]);
 return Number(r[0].attempts)<=10;
 });}catch(e){if(!missing(e))throw e;console.warn("HRenter: migration 0002 required for distributed login limiting");return localLimit(key);}
}
export async function audit(actor:string|null,action:string,target:string|null=null){
 try{await execute("INSERT INTO audit_logs(id,actor_id,action,target_id) VALUES (?,?,?,?)",[randomUUID(),actor,action,target]);}
 catch(e){console.warn("HRenter audit persistence unavailable",action,actor,target,(e as {code?:string})?.code||"unknown");}
}
export class Busy extends Error{}
export async function organizationWrite<T>(fn:()=>Promise<T>):Promise<T>{
 const c=await createConnection(getDbOptions());
 try{const [r]=await c.execute<RowDataPacket[]>("SELECT GET_LOCK('hrenter_org_write',8) AS acquired");if(Number(r[0].acquired)!==1)throw new Busy("Data sedang diproses. Coba lagi.");
 return await fn();}finally{await c.end();}
}
