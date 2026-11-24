import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { db } from "./db";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "default-secret-change-me"
);

export interface AuthResult {
  userId?: string;
  email?: string;
  error?: string;
  status?: number;
}

export async function getApiSession(): Promise<AuthResult> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("hrd_session")?.value;
    if (!token) return { error: "Unauthorized", status: 401 };

    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: String(payload.userId),
      email: String(payload.email),
    };
  } catch {
    return { error: "Unauthorized", status: 401 };
  }
}

export async function requirePermission(
  permissionCode: string
): Promise<AuthResult> {
  const session = await getApiSession();
  if (session.error) return session;

  // Check if system admin
  const userRole = await db.userRole.findFirst({
    where: { userId: session.userId! },
    include: { role: true },
  });
  if (userRole?.role.code === "SUPER_ADMIN" && userRole.role.isActive) {
    return session;
  }

  // Check permission via user permissions or role permissions
  const permission = await db.appPermission.findUnique({
    where: { code: permissionCode },
  });
  if (!permission) return { error: "Permission not found", status: 403 };

  // User-specific override
  const userPerm = await db.userPermission.findUnique({
    where: {
      userId_permissionId: {
        userId: session.userId!,
        permissionId: permission.id,
      },
    },
  });
  if (userPerm?.effect === "DENY")
    return { error: "Forbidden", status: 403 };
  if (userPerm?.effect === "ALLOW") return session;

  // Role-based
  const rolePerm = await db.rolePermission.findFirst({
    where: {
      permissionId: permission.id,
      role: {
        userRoles: { some: { userId: session.userId! } },
        isActive: true,
      },
    },
  });
  if (!rolePerm) return { error: "Forbidden", status: 403 };

  return session;
}

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}