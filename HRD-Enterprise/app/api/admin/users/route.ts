import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/api";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

async function auth(permission: string) {
  const session = await requirePermission(permission);
  if (session.error) return { error: session.error, status: session.status || 403 };
  return { user: { id: session.userId } };
}

export async function GET() {
  const auth = await auth("user.view");
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status || 403 });
  const users = await db.user.findMany({
    include: {
      userProfile: { select: { fullName: true, isActive: true } },
      userRoles: { include: { role: { select: { code: true, name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
  const formatted = users.map((u: any) => ({
    id: u.id,
    email: u.email,
    full_name: u.userProfile?.fullName ?? u.fullName ?? null,
    role_code: u.userRoles?.[0]?.role?.code ?? null,
    role_name: u.userRoles?.[0]?.role?.name ?? null,
    is_active: u.userProfile?.isActive ?? u.isActive,
  }));
  return NextResponse.json({ users: formatted });
}

export async function POST(req: NextRequest) {
  const auth = await auth("user.create");
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status || 403 });
  const body = await req.json();
  const email = String(body.email || "").trim().toLowerCase();
  const fullName = String(body.full_name || "").trim();
  const password = String(body.password || "");
  if (!email || !password) return NextResponse.json({ error: "Email dan password wajib diisi." }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "Password minimal 8 karakter." }, { status: 400 });
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Email sudah terdaftar." }, { status: 400 });
  const passwordHash = await hashPassword(password);
  const user = await db.user.create({
    data: {
      email,
      passwordHash,
      fullName,
      isActive: true,
      userProfile: {
        create: {
          fullName,
          isActive: true,
        },
      },
    },
  });
  return NextResponse.json({ user: { id: user.id, email: user.email } }, { status: 201 });
}