import { NextResponse } from "next/server";
import { verifyRegistrationResponse, type RegistrationResponseJSON } from "@simplewebauthn/server";
import { PasskeyError, bytesToBase64Url, sanitizePasskeyName } from "@/lib/passkeys-store";
import { savePasskey } from "@/lib/passkeys";
import { hasSession } from "@/lib/session";
import { takeWebAuthnChallenge } from "@/lib/webauthn";
import { relyingParty } from "@/lib/webauthn-config";

export async function POST(request: Request) {
  if (!(await hasSession())) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const challenge = await takeWebAuthnChallenge("register");
  if (!challenge) return NextResponse.json({ error: "Desafio de passkey expirado. Tente novamente." }, { status: 400 });

  let body: { response?: RegistrationResponseJSON; name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }
  if (!body.response) return NextResponse.json({ error: "Resposta de passkey ausente." }, { status: 400 });

  const rp = relyingParty(request);
  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: body.response,
      expectedChallenge: challenge,
      expectedOrigin: rp.origin,
      expectedRPID: rp.rpID,
      requireUserVerification: true,
    });
  } catch {
    return NextResponse.json({ error: "Não foi possível verificar a passkey." }, { status: 400 });
  }
  if (!verification.verified) {
    return NextResponse.json({ error: "Não foi possível verificar a passkey." }, { status: 400 });
  }

  const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
  try {
    await savePasskey({
      id: credential.id,
      publicKey: bytesToBase64Url(credential.publicKey),
      counter: credential.counter,
      transports: credential.transports,
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
      name: sanitizePasskeyName(typeof body.name === "string" ? body.name : ""),
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof PasskeyError ? error.message : "Não foi possível guardar a passkey.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
