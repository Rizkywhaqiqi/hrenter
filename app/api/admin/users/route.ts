import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/api";
import { rows, transaction } from "@/lib/db";
import { randomUUID } from "node:crypto";
import { hashPassword } from "@/lib/auth";
import { isSystemAdmin } from "@/lib/permissions";

async function authorize(permission: string) {
  const session = await requirePermission(permission);
  if (session.error) return { error: session.error, status: session.status || 403 };
  if (!(await isSystemAdmin(session.userId!))) return { error: "Forbidden", status: 403 };
  return { user: { id: session.userId } };
}

export async function GET() {
  const auth = await authorize("user.view");
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status || 403 });
  const users = await rows("SELECT u.id,u.email,COALESCE(p.full_name,u.full_name) AS full_name,COALESCE(p.is_active,u.is_active) AS is_active,(SELECT r.code FROM user_roles ur JOIN app_roles r ON r.id=ur.role_id WHERE ur.user_id=u.id ORDER BY r.code LIMIT 1) AS role_code,(SELECT r.name FROM user_roles ur JOIN app_roles r ON r.id=ur.role_id WHERE ur.user_id=u.id ORDER BY r.code LIMIT 1) AS role_name FROM users u LEFT JOIN user_profiles p ON p.user_id=u.id ORDER BY u.created_at DESC");
  return NextResponse.json({users:users.map(u=>({...u,is_active:!!u.is_active}))});
}

export async function POST(req: NextRequest) {
  const auth = await authorize("user.create");
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status || 403 });
  const body = await req.json();
  const email = String(body.email || "").trim().toLowerCase();
  const fullName = String(body.full_name || "").trim();
  const password = String(body.password || "");
  if (!email || !password) return NextResponse.json({ error: "Email dan password wajib diisi." }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "Password minimal 8 karakter." }, { status: 400 });
  const existing = (await rows("SELECT id FROM users WHERE email=?",[email]))[0];
  if (existing) return NextResponse.json({ error: "Email sudah terdaftar." }, { status: 400 });
  const passwordHash = await hashPassword(password);
  const user = {id:randomUUID(),email};
  await transaction(async c=>{await c.execute("INSERT INTO users (id,email,password_hash,full_name) VALUES (?,?,?,?)",[user.id,email,passwordHash,fullName]);await c.execute("INSERT INTO user_profiles (id,user_id,full_name) VALUES (?,?,?)",[randomUUID(),user.id,fullName]);});
  return NextResponse.json({ user: { id: user.id, email: user.email } }, { status: 201 });
}