import { NextResponse } from "next/server";
import { verifyAuthenticationResponse, type AuthenticationResponseJSON } from "@simplewebauthn/server";
import { clearClientAttempts, loginAllowed, recordFailedLogin } from "@/lib/login-rate-limit";
import { listStoredPasskeys, savePasskeyCounter } from "@/lib/passkeys";
import { base64UrlToBytes } from "@/lib/passkeys-store";
import { requestClient } from "@/lib/request-client";
import { createSession } from "@/lib/session";
import { takeWebAuthnChallenge } from "@/lib/webauthn";
import { relyingParty } from "@/lib/webauthn-config";

export async function POST(request: Request) {
  const client = requestClient(request.headers);
  if (!loginAllowed(client)) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde alguns minutos." }, { status: 429 });
  }

  const challenge = await takeWebAuthnChallenge("login");
  if (!challenge) {
    recordFailedLogin(client);
    return NextResponse.json({ error: "Desafio de passkey expirado. Tente novamente." }, { status: 400 });
  }

  let body: AuthenticationResponseJSON;
  try {
    body = await request.json();
  } catch {
    recordFailedLogin(client);
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const stored = (await listStoredPasskeys()).find((passkey) => passkey.id === body.id);
  if (!stored) {
    recordFailedLogin(client);
    return NextResponse.json({ error: "Passkey não reconhecida." }, { status: 400 });
  }

  const rp = relyingParty(request);
  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge: challenge,
      expectedOrigin: rp.origin,
      expectedRPID: rp.rpID,
      credential: {
        id: stored.id,
        publicKey: base64UrlToBytes(stored.publicKey),
        counter: stored.counter,
        transports: stored.transports,
      },
      requireUserVerification: true,
    });
  } catch {
    recordFailedLogin(client);
    return NextResponse.json({ error: "Não foi possível verificar a passkey." }, { status: 400 });
  }
  if (!verification.verified) {
    recordFailedLogin(client);
    return NextResponse.json({ error: "Não foi possível verificar a passkey." }, { status: 400 });
  }

  await savePasskeyCounter(stored.id, verification.authenticationInfo.newCounter);
  clearClientAttempts(client);
  await createSession();
  return NextResponse.json({ ok: true });
}
