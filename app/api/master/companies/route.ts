import { NextRequest } from "next/server";
import { requirePermission, json } from "@/lib/api";
import { rows } from "@/lib/db";
import { listMaster, saveMaster } from "@/lib/master";
import { employeeScope } from "@/lib/scope";
import { isSystemAdmin } from "@/lib/permissions";

export async function GET() {
  const auth = await requirePermission("company.view");
  if (auth.error) return json({ error: auth.error }, auth.status || 403);

  const rows = await listMaster("companies", await employeeScope(auth.userId!));
  return json({ data: rows });
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission("company.create");
  if (auth.error) return json({ error: auth.error }, auth.status || 403);
  if (!(await isSystemAdmin(auth.userId!))) return json({ error: "Forbidden" }, 403);

  const body = await req.json();
  const { code, name, legal_name, npwp, phone, email, is_active } = body;

  if (!code || !name) {
    return json({ error: "Code dan Name wajib diisi." }, 400);
  }

  const row = await saveMaster("companies",{
      code,
      name,
      legalName: legal_name || null,
      npwp: npwp || null,
      phone: phone || null,
      email: email || null,
      isActive: is_active ?? true,
    },await employeeScope(auth.userId!));
  if (!row) return json({error:"Not found"},404);
  return json({ data: row }, 201);
}