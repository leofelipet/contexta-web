import { NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { MAX_PASSKEYS } from "@/lib/auth-settings";
import { listStoredPasskeys } from "@/lib/passkeys";
import { hasSession } from "@/lib/session";
import { relyingParty } from "@/lib/webauthn-config";
import { setWebAuthnChallenge } from "@/lib/webauthn";

export async function POST(request: Request) {
  if (!(await hasSession())) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  let existing;
  try {
    existing = await listStoredPasskeys();
  } catch {
    return NextResponse.json({ error: "Não foi possível ler as passkeys." }, { status: 502 });
  }
  if (existing.length >= MAX_PASSKEYS) {
    return NextResponse.json({ error: "Limite de passkeys atingido." }, { status: 400 });
  }
  const rp = relyingParty(request);
  const options = await generateRegistrationOptions({
    rpName: rp.rpName,
    rpID: rp.rpID,
    userName: "admin",
    userDisplayName: "Administrador",
    userID: new TextEncoder().encode("contexta-admin"),
    attestationType: "none",
    excludeCredentials: existing.map((passkey) => ({
      id: passkey.id,
      transports: passkey.transports,
    })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "required",
    },
  });
  await setWebAuthnChallenge(options.challenge, "register");
  return NextResponse.json(options);
}
