import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify, SignJWT } from "jose";
import { cookieSecure, SESSION_TTL_MS } from "@/lib/auth-settings";

export const SESSION_COOKIE = "contexta_session";
const ISSUER = "contexta-admin";
const AUDIENCE = "contexta-web";

export function sessionSecret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("SESSION_SECRET deve ter ao menos 32 caracteres");
  return new TextEncoder().encode(value);
}

function cookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt,
  };
}

export async function createSession() {
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const token = await new SignJWT({ authenticated: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(expiresAt)
    .sign(sessionSecret());
  (await cookies()).set(SESSION_COOKIE, token, cookieOptions(expiresAt));
}

export async function verifySessionToken(token?: string) {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, sessionSecret(), { issuer: ISSUER, audience: AUDIENCE });
    return payload.authenticated === true;
  } catch {
    return false;
  }
}

export async function hasSession() {
  return verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);
}

export async function requireSession() {
  if (!(await hasSession())) redirect("/login");
}

export async function clearSession() {
  (await cookies()).delete(SESSION_COOKIE);
}
