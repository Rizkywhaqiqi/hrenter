import { NextRequest, NextResponse } from "next/server";
import { login } from "@/lib/auth";
export async function POST(req: NextRequest) {
  if (req.headers.get("origin") !== new URL(req.url).origin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (typeof body?.email !== "string" || typeof body?.password !== "string" || body.email.length > 255 || body.password.length > 72) return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
  const result = await login(body.email, body.password);
  if (!result) return NextResponse.json({ error: "Email atau password salah." }, { status: 401 });
  return NextResponse.json({ user: result.user });
}
