import { NextRequest, NextResponse } from "next/server";
import { reserveLogin,audit } from "@/lib/security";
import { login } from "@/lib/auth";
export async function POST(req: NextRequest) {
  if (req.headers.get("origin") !== new URL(req.url).origin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (typeof body?.email !== "string" || typeof body?.password !== "string" || body.email.length > 255 || Buffer.byteLength(body.password,"utf8") > 72) return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
  let result;try{const ip=req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||"unknown";if(!await reserveLogin(body.email,ip))return NextResponse.json({error:"Terlalu banyak percobaan. Coba lagi dalam 10 menit."},{status:429,headers:{"Retry-After":"600"}});result=await login(body.email,body.password)}catch{ return NextResponse.json({error:"Layanan login sementara tidak tersedia."},{status:503}); }
  if (!result) return NextResponse.json({ error: "Email atau password salah." }, { status: 401 });
  await audit(result.user.id,"auth.login",result.user.id);
  return NextResponse.json({ user: result.user });
}
