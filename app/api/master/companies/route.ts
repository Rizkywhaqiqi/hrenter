import { NextRequest } from "next/server";
import { requirePermission, json } from "@/lib/api";
import { db } from "@/lib/db";
import { employeeScope } from "@/lib/scope";
import { isSystemAdmin } from "@/lib/permissions";

export async function GET() {
  const auth = await requirePermission("company.view");
  if (auth.error) return json({ error: auth.error }, auth.status || 403);

  const scope = await employeeScope(auth.userId!);
  const rows = await db.company.findMany({
    where: { id: scope.companyId },
    orderBy: { createdAt: "desc" },
  });
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

  const row = await db.company.create({
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
  return json({ data: row }, 201);
}