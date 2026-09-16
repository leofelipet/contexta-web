import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "contexta_session";
const ISSUER = "contexta-admin";
const AUDIENCE = "contexta-web";

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("SESSION_SECRET deve ter ao menos 32 caracteres");
  return new TextEncoder().encode(value);
}

export async function createSession() {
  const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000);
  const token = await new SignJWT({ authenticated: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(expiresAt)
    .sign(secret());
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.SESSION_COOKIE_SECURE
      ? process.env.SESSION_COOKIE_SECURE === "true"
      : process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function verifySessionToken(token?: string) {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secret(), { issuer: ISSUER, audience: AUDIENCE });
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
