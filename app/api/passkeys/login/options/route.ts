import { NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { listStoredPasskeys } from "@/lib/passkeys";
import { relyingParty } from "@/lib/webauthn-config";
import { setWebAuthnChallenge } from "@/lib/webauthn";

export async function POST(request: Request) {
  let existing;
  try {
    existing = await listStoredPasskeys();
  } catch {
    return NextResponse.json({ error: "Não foi possível ler as passkeys." }, { status: 502 });
  }
  if (existing.length === 0) {
    return NextResponse.json({ error: "Nenhuma passkey cadastrada." }, { status: 400 });
  }
  const rp = relyingParty(request);
  const options = await generateAuthenticationOptions({
    rpID: rp.rpID,
    allowCredentials: existing.map((passkey) => ({
      id: passkey.id,
      transports: passkey.transports,
    })),
    userVerification: "required",
  });
  await setWebAuthnChallenge(options.challenge, "login");
  return NextResponse.json(options);
}
