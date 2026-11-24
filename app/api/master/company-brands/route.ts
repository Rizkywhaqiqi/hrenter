import { requirePermission, json } from "@/lib/api";
import { rows } from "@/lib/db";
import { listMaster, saveMaster } from "@/lib/master";
import { employeeScope } from "@/lib/scope";
import { isSystemAdmin } from "@/lib/permissions";

export async function GET() {
  const auth = await requirePermission("company.view");
  if (auth.error) return json({ error: auth.error }, auth.status || 403);

  const rows = await listMaster("company_brands", await employeeScope(auth.userId!));
  return json({ data: rows });
}