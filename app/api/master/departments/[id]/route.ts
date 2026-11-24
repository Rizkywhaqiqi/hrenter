import { NextRequest } from "next/server";
import { requirePermission, json } from "@/lib/api";
import { db } from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission("department.update");
  if (auth.error) return json({ error: auth.error }, auth.status || 403);

  const body = await req.json();
  const { code, name, is_active } = body;

  if (!code || !name) {
    return json({ error: "Code dan Name wajib diisi." }, 400);
  }

  const row = await db.department.update({
    where: { id: (await params).id },
    data: {
      code,
      name,
      isActive: is_active ?? true,
    },
  });
  return json({ data: row });
}