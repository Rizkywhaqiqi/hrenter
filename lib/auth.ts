import { compare, hash } from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { rows } from "./db";

function jwtSecret() {
  const secret = process.env.AUTH_SECRET || process.env.JWT_SECRET;
  if (!secret || new TextEncoder().encode(secret).length < 32) throw new Error("AUTH_SECRET must be at least 32 bytes");
  return new TextEncoder().encode(secret);
}
const COOKIE_NAME = "hrd_session";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

export async function comparePassword(
  plain: string,
  hashed: string
): Promise<boolean> {
  return compare(plain, hashed);
}

export async function signToken(payload: {
  userId: string;
  email: string;
}): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(jwtSecret());
}

export async function verifyToken(token: string): Promise<{
  userId: string;
  email: string;
} | null> {
  try {
    const { payload } = await jwtVerify(token, jwtSecret(), { algorithms: ["HS256"] });
    if (typeof payload.userId !== "string" || typeof payload.email !== "string") return null;
    return {
      userId: String(payload.userId),
      email: String(payload.email),
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<{
  userId: string;
  email: string;
} | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await verifyToken(token);
  if (!session) return null;
  const [user] = await rows("SELECT u.id,u.email FROM users u JOIN user_profiles p ON p.user_id=u.id WHERE u.id=? AND u.is_active=1 AND p.is_active=1",[session.userId]);
  if (!user) return null;
  return { userId: user.id, email: user.email };
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

export async function login(email: string, password: string): Promise<{
  user: { id: string; email: string; fullName: string | null };
  token: string;
} | null> {
  const [user] = await rows("SELECT u.id,u.email,u.password_hash AS passwordHash,COALESCE(p.full_name,u.full_name) AS fullName FROM users u JOIN user_profiles p ON p.user_id=u.id WHERE u.email=? AND u.is_active=1 AND p.is_active=1",[email.trim().toLowerCase()]);

  if (!user) return null;

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) return null;

  const token = await signToken({
    userId: user.id,
    email: user.email,
  });

  await setSessionCookie(token);

  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
    },
    token,
  };
}

export async function logout(): Promise<void> {
  await clearSessionCookie();
}
