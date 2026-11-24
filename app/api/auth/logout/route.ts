import { NextRequest, NextResponse } from "next/server";
import { logout } from "@/lib/auth";
export async function POST(req: NextRequest) {
  if (req.headers.get("origin") !== new URL(req.url).origin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await logout();
  return NextResponse.json({ ok: true });
}
