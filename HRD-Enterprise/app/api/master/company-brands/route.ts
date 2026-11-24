import { requirePermission, json } from "@/lib/api";
import { db } from "@/lib/db";

export async function GET() {
  const auth = await requirePermission("company.view");
  if (auth.error) return json({ error: auth.error }, auth.status || 403);

  const rows = await db.companyBrand.findMany({
    include: {
      company: { select: { id: true, code: true, name: true } },
      brand: { select: { id: true, code: true, name: true } },
    },
  });
  return json({ data: rows });
}