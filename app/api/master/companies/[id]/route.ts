import { NextRequest } from "next/server";
import { requirePermission, json } from "@/lib/api";
import { db } from "@/lib/db";
import { isSystemAdmin } from "@/lib/permissions";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission("company.update");
  if (auth.error) return json({ error: auth.error }, auth.status || 403);
  if (!(await isSystemAdmin(auth.userId!))) return json({ error: "Forbidden" }, 403);

  const body = await req.json();
  const { code, name, legal_name, npwp, phone, email, is_active } = body;

  if (!code || !name) {
    return json({ error: "Code dan Name wajib diisi." }, 400);
  }

  const row = await db.company.update({
    where: { id: (await params).id },
    data: {
      code,
      name,
      legalName: legal_name || null,
      npwp: npwp || null,
      phone: phone || null,
      email: email || null,
      isActive: is_active ?? true,
    },
  });
  return json({ data: row });
}