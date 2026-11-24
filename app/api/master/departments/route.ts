import { NextRequest } from "next/server";
import { requirePermission, json } from "@/lib/api";
import { db } from "@/lib/db";

export async function GET() {
  const auth = await requirePermission("department.view");
  if (auth.error) return json({ error: auth.error }, auth.status || 403);

  const rows = await db.department.findMany({
    orderBy: { createdAt: "desc" },
  });
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

  const row = await db.department.create({
    data: {
      code,
      name,
      isActive: is_active ?? true,
    },
  });
  return json({ data: row }, 201);
}