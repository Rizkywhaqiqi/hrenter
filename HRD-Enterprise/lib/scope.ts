import { db } from "./db";
import { isSystemAdmin } from "./permissions";

export async function employeeScope(userId: string) {
  if (await isSystemAdmin(userId)) return {};
  const [companies, brands, outlets] = await Promise.all([
    db.userCompanyAccess.findMany({ where: { userId }, select: { companyId: true } }),
    db.userBrandAccess.findMany({ where: { userId }, select: { brandId: true } }),
    db.userOutletAccess.findMany({ where: { userId }, select: { outletId: true } }),
  ]);
  return { companyId: { in: companies.map(x => x.companyId) }, brandId: { in: brands.map(x => x.brandId) }, outletId: { in: outlets.map(x => x.outletId) } };
}
export async function validEmployeeDestination(userId: string, companyId: string, brandId: string, outletId: string) {
  const scope = await employeeScope(userId);
  const outlet = await db.outlet.findFirst({ where: { AND: [{ companyId: scope.companyId, brandId: scope.brandId, id: scope.outletId }, { companyId, brandId, id: outletId, isActive: true }] } });
  return !!outlet;
}
