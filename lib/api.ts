import { NextResponse } from "next/server";
import { getSession } from "./auth";
import { hasPermission } from "./permissions";

export interface AuthResult {
  userId?: string;
  email?: string;
  error?: string;
  status?: number;
}
export async function getApiSession(): Promise<AuthResult> {
  const session = await getSession();
  return session ?? { error: "Unauthorized", status: 401 };
}
export async function requirePermission(permissionCode: string): Promise<AuthResult> {
  const session = await getApiSession();
  if (!session.userId) return session;
  return await hasPermission(session.userId, permissionCode) ? session : { error: "Forbidden", status: 403 };
}
export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}
