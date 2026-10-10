import { describe, expect, it } from "vitest";
import { passkeyCanceled, passkeyUserMessage } from "./passkey-client";

describe("passkey client errors", () => {
  it("detects a canceled WebAuthn prompt", () => {
    const canceled = Object.assign(new Error("The operation was aborted."), { name: "NotAllowedError" });
    expect(passkeyCanceled(canceled)).toBe(true);
    expect(passkeyUserMessage(canceled)).toBe("Autenticação cancelada.");
  });

  it("detects a wrapped cancellation", () => {
    expect(passkeyCanceled({ name: "WebAuthnError", cause: { name: "NotAllowedError" } })).toBe(true);
  });

  it("maps missing WebAuthn support", () => {
    expect(passkeyUserMessage(new Error("WebAuthn is not supported in this browser"))).toBe(
      "Este navegador não suporta passkeys.",
    );
  });
});
