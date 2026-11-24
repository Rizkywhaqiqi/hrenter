import { NextRequest } from "next/server";
import { requirePermission, json } from "@/lib/api";
import { rows } from "@/lib/db";
import { listMaster, saveMaster } from "@/lib/master";
import { employeeScope } from "@/lib/scope";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission("position.update");
  if (auth.error) return json({ error: auth.error }, auth.status || 403);

  const body = await req.json();
  const { code, name, level, is_active } = body;

  if (!code || !name) {
    return json({ error: "Code dan Name wajib diisi." }, 400);
  }

  const row = await saveMaster("positions",{
      code,
      name,
      level: level ? Number(level) : null,
      isActive: is_active ?? true,
    },await employeeScope(auth.userId!),(await params).id);
  if (!row) return json({error:"Not found"},404);
  return json({ data: row });
}