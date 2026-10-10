import "server-only";

import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { cookieSecure } from "@/lib/auth-settings";
import { sessionSecret } from "@/lib/session";

export const WEBAUTHN_CHALLENGE_COOKIE = "contexta_webauthn";
const ISSUER = "contexta-webauthn";
const TTL_MS = 5 * 60 * 1000;

export type WebAuthnPurpose = "register" | "login";

export async function setWebAuthnChallenge(challenge: string, purpose: WebAuthnPurpose) {
  const expiresAt = new Date(Date.now() + TTL_MS);
  const token = await new SignJWT({ challenge, purpose })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setExpirationTime(expiresAt)
    .sign(sessionSecret());
  (await cookies()).set(WEBAUTHN_CHALLENGE_COOKIE, token, {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function takeWebAuthnChallenge(expected: WebAuthnPurpose) {
  const store = await cookies();
  const token = store.get(WEBAUTHN_CHALLENGE_COOKIE)?.value;
  store.delete(WEBAUTHN_CHALLENGE_COOKIE);
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, sessionSecret(), { issuer: ISSUER });
    if (payload.purpose !== expected || typeof payload.challenge !== "string" || payload.challenge.length === 0) {
      return null;
    }
    return payload.challenge;
  } catch {
    return null;
  }
}
