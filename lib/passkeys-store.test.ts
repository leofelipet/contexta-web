import { describe, expect, it } from "vitest";
import {
  assertCanDeletePasskey,
  PasskeyError,
  sanitizePasskeyName,
  toPublicPasskey,
} from "./passkeys-store";

describe("passkeys helpers", () => {
  it("sanitizes names", () => {
    expect(sanitizePasskeyName("  ")).toBe("Passkey");
    expect(sanitizePasskeyName(` ${"a".repeat(80)} `)).toHaveLength(64);
  });

  it("hides the public key from the public view", () => {
    expect(toPublicPasskey({
      id: "one",
      publicKey: "secret",
      counter: 2,
      name: "iPhone",
      createdAt: "2026-10-10T12:00:00.000Z",
    })).toEqual({
      id: "one",
      name: "iPhone",
      createdAt: "2026-10-10T12:00:00.000Z",
      deviceType: undefined,
      backedUp: undefined,
    });
  });

  it("keeps the last passkey when password login is disabled", () => {
    expect(() => assertCanDeletePasskey(1, false)).toThrow(PasskeyError);
    expect(() => assertCanDeletePasskey(2, false)).not.toThrow();
    expect(() => assertCanDeletePasskey(1, true)).not.toThrow();
  });
});
