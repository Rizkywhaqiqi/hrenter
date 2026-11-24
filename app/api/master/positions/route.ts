import { NextRequest } from "next/server";
import { requirePermission, json } from "@/lib/api";
import { db } from "@/lib/db";

export async function GET() {
  const auth = await requirePermission("position.view");
  if (auth.error) return json({ error: auth.error }, auth.status || 403);

  const rows = await db.position.findMany({
    orderBy: { createdAt: "desc" },
  });
  return json({ data: rows });
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission("position.create");
  if (auth.error) return json({ error: auth.error }, auth.status || 403);

  const body = await req.json();
  const { code, name, level, is_active } = body;

  if (!code || !name) {
    return json({ error: "Code dan Name wajib diisi." }, 400);
  }

  const row = await db.position.create({
    data: {
      code,
      name,
      level: level ? Number(level) : null,
      isActive: is_active ?? true,
    },
  });
  return json({ data: row }, 201);
}