import { NextRequest } from "next/server";
import { requirePermission, json } from "@/lib/api";
import { rows, execute } from "@/lib/db";
import { listMaster } from "@/lib/master";
import { employeeScope } from "@/lib/scope";
import { isSystemAdmin } from "@/lib/permissions";

export async function GET() {
  const auth=await requirePermission("company.view");
  if(auth.error)return json({error:auth.error},auth.status||403);
  return json({data:await listMaster("company_brands",await employeeScope(auth.userId!)),canManage:await isSystemAdmin(auth.userId!)});
}
export async function POST(req:NextRequest){
  const auth=await requirePermission("company.update");
  if(auth.error)return json({error:auth.error},auth.status||403);
  if(!await isSystemAdmin(auth.userId!))return json({error:"Forbidden"},403);
  const body=await req.json().catch(()=>null);
  const company=body?.company_id,brand=body?.brand_id;
  if(typeof company!=="string"||typeof brand!=="string"||!company||!brand)return json({error:"Brand dan CV wajib dipilih."},400);
  const result=await execute("INSERT INTO company_brands (company_id,brand_id) SELECT c.id,b.id FROM companies c CROSS JOIN brands b WHERE c.id=? AND b.id=? AND c.is_active=1 AND b.is_active=1 ON DUPLICATE KEY UPDATE company_id=company_brands.company_id",[company,brand]);
  const [link]=await rows("SELECT 1 FROM company_brands cb JOIN companies c ON c.id=cb.company_id JOIN brands b ON b.id=cb.brand_id WHERE cb.company_id=? AND cb.brand_id=? AND c.is_active=1 AND b.is_active=1",[company,brand]);
  if(!link)return json({error:"Brand atau CV tidak aktif atau tidak ditemukan."},400);
  return json({ok:true,created:result.affectedRows===1});
}
