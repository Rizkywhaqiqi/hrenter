import { compare, hash } from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "./db";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "default-secret-change-me"
);
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
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<{
  userId: string;
  email: string;
} | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
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
  return verifyToken(token);
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
  const user = await db.user.findUnique({
    where: { email },
    include: { userProfile: true },
  });

  if (!user || !user.isActive) return null;

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
      fullName: user.userProfile?.fullName ?? user.fullName,
    },
    token,
  };
}

export async function logout(): Promise<void> {
  await clearSessionCookie();
}
