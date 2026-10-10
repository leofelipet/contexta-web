import { afterEach, describe, expect, it } from "vitest";
import { relyingParty } from "./webauthn-config";

describe("relyingParty", () => {
  const originalId = process.env.WEBAUTHN_RP_ID;
  const originalOrigin = process.env.WEBAUTHN_ORIGIN;

  afterEach(() => {
    if (originalId === undefined) delete process.env.WEBAUTHN_RP_ID;
    else process.env.WEBAUTHN_RP_ID = originalId;
    if (originalOrigin === undefined) delete process.env.WEBAUTHN_ORIGIN;
    else process.env.WEBAUTHN_ORIGIN = originalOrigin;
  });

  it("uses forwarded host when origin is missing", () => {
    delete process.env.WEBAUTHN_RP_ID;
    delete process.env.WEBAUTHN_ORIGIN;
    const rp = relyingParty({
      url: "http://127.0.0.1:3000/api/passkeys/login/options",
      headers: new Headers({
        "x-forwarded-host": "contexta.leofelipe.com.br",
        "x-forwarded-proto": "https",
      }),
    });
    expect(rp).toEqual({
      rpName: "Contexta",
      rpID: "contexta.leofelipe.com.br",
      origin: "https://contexta.leofelipe.com.br",
    });
  });

  it("uses the browser origin header", () => {
    delete process.env.WEBAUTHN_RP_ID;
    delete process.env.WEBAUTHN_ORIGIN;
    const rp = relyingParty({
      url: "http://127.0.0.1:3000/api/passkeys/login/options",
      headers: new Headers({ origin: "http://localhost:3000" }),
    });
    expect(rp).toEqual({ rpName: "Contexta", rpID: "localhost", origin: "http://localhost:3000" });
  });

  it("prefers explicit env values", () => {
    process.env.WEBAUTHN_RP_ID = "https://admin.example.com";
    process.env.WEBAUTHN_ORIGIN = "https://admin.example.com";
    const rp = relyingParty({
      url: "http://127.0.0.1:3000/api/passkeys/login/options",
      headers: new Headers({ origin: "http://localhost:3000" }),
    });
    expect(rp).toEqual({
      rpName: "Contexta",
      rpID: "admin.example.com",
      origin: "https://admin.example.com",
    });
  });
});
