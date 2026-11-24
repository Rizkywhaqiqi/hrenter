import { NextRequest } from "next/server";
import { requirePermission, json } from "@/lib/api";
import { rows } from "@/lib/db";
import { listMaster, saveMaster } from "@/lib/master";
import { employeeScope } from "@/lib/scope";

export async function GET() {
  const auth = await requirePermission("department.view");
  if (auth.error) return json({ error: auth.error }, auth.status || 403);

  const rows = await listMaster("departments", await employeeScope(auth.userId!));
  return json({ data: rows });
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission("department.create");
  if (auth.error) return json({ error: auth.error }, auth.status || 403);

  const body = await req.json();
  const { code, name, is_active } = body;

  if (!code || !name) {
    return json({ error: "Code dan Name wajib diisi." }, 400);
  }

  const row = await saveMaster("departments",{
      code,
      name,
      isActive: is_active ?? true,
    },await employeeScope(auth.userId!));
  if (!row) return json({error:"Not found"},404);
  return json({ data: row }, 201);
}