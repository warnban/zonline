import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

const COOKIE = "zynqo_admin";
const TTL_SEC = 60 * 60 * 24 * 7;

export type AdminSession = {
  adminId: string;
  email: string;
  name: string | null;
};

function secretKey() {
  return new TextEncoder().encode(env.ADMIN_JWT_SECRET);
}

export async function createSessionToken(session: AdminSession): Promise<string> {
  return new SignJWT({
    email: session.email,
    name: session.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.adminId)
    .setIssuedAt()
    .setExpirationTime(`${TTL_SEC}s`)
    .sign(secretKey());
}

export async function verifySessionToken(token: string): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const adminId = payload.sub;
    const email = payload.email;
    if (!adminId || typeof email !== "string") return null;
    return {
      adminId,
      email,
      name: typeof payload.name === "string" ? payload.name : null,
    };
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TTL_SEC,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export { COOKIE as ADMIN_COOKIE_NAME };
