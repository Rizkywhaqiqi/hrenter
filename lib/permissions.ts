import { db } from "./db";

export async function isSystemAdmin(userId: string): Promise<boolean> {
  const userRole = await db.userRole.findFirst({
    where: { userId, role: { code: "SUPER_ADMIN", isActive: true }, user: { isActive: true } },
    include: { role: true },
  });
  return userRole?.role.code === "SUPER_ADMIN" && userRole.role.isActive;
}

export async function hasPermission(
  userId: string,
  permissionCode: string
): Promise<boolean> {
  const user = await db.user.findUnique({ where: { id: userId }, include: { userProfile: true } });
  if (!user?.isActive || user.userProfile?.isActive === false) return false;
  // 1. SUPER_ADMIN bypass
  if (await isSystemAdmin(userId)) return true;

  // 2. Check user profile active status
  const profile = await db.userProfile.findUnique({
    where: { userId },
  });
  if (profile && !profile.isActive) return false;

  // 3. Find permission
  const permission = await db.appPermission.findUnique({
    where: { code: permissionCode },
  });
  if (!permission) return false;

  // 4. User-specific override (DENY/ALLOW)
  const userPerm = await db.userPermission.findUnique({
    where: {
      userId_permissionId: {
        userId,
        permissionId: permission.id,
      },
    },
  });
  if (userPerm?.effect === "DENY") return false;
  if (userPerm?.effect === "ALLOW") return true;

  // 5. Role-based permission
  const rolePerm = await db.rolePermission.findFirst({
    where: {
      permissionId: permission.id,
      role: {
        userRoles: {
          some: { userId },
        },
        isActive: true,
      },
    },
  });
  return !!rolePerm;
}

export async function hasCompanyAccess(
  userId: string,
  companyId: string
): Promise<boolean> {
  if (await isSystemAdmin(userId)) return true;
  const access = await db.userCompanyAccess.findUnique({
    where: {
      userId_companyId: {
        userId,
        companyId,
      },
    },
  });
  return !!access;
}

export async function hasBrandAccess(
  userId: string,
  brandId: string
): Promise<boolean> {
  if (await isSystemAdmin(userId)) return true;
  const access = await db.userBrandAccess.findUnique({
    where: {
      userId_brandId: {
        userId,
        brandId,
      },
    },
  });
  return !!access;
}

export async function hasOutletAccess(
  userId: string,
  outletId: string
): Promise<boolean> {
  if (await isSystemAdmin(userId)) return true;
  const access = await db.userOutletAccess.findUnique({
    where: {
      userId_outletId: {
        userId,
        outletId,
      },
    },
  });
  return !!access;
}

export async function canAccessCompany(
  userId: string,
  companyId: string,
  permissionCode: string
): Promise<boolean> {
  return (
    (await hasPermission(userId, permissionCode)) &&
    (await hasCompanyAccess(userId, companyId))
  );
}

export async function canAccessBrand(
  userId: string,
  brandId: string,
  permissionCode: string
): Promise<boolean> {
  return (
    (await hasPermission(userId, permissionCode)) &&
    (await hasBrandAccess(userId, brandId))
  );
}

export async function canAccessOutlet(
  userId: string,
  outletId: string,
  permissionCode: string
): Promise<boolean> {
  return (
    (await hasPermission(userId, permissionCode)) &&
    (await hasOutletAccess(userId, outletId))
  );
}

export async function getUserSession(): Promise<{
  userId: string;
  email: string;
} | null> {
  const { getSession } = await import("./auth");
  return getSession();
}