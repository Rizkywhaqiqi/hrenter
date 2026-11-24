import { requirePermission, json } from "@/lib/api";
import { db } from "@/lib/db";
import { employeeScope } from "@/lib/scope";
import { isSystemAdmin } from "@/lib/permissions";

export async function GET() {
  const auth = await requirePermission("company.view");
  if (auth.error) return json({ error: auth.error }, auth.status || 403);

  const scope = await employeeScope(auth.userId!);
  const rows = await db.companyBrand.findMany({
    where: { companyId: scope.companyId, brandId: scope.brandId },
    include: {
      company: { select: { id: true, code: true, name: true } },
      brand: { select: { id: true, code: true, name: true } },
    },
  });
  return json({ data: rows });
}