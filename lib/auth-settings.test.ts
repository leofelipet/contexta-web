import { afterEach, describe, expect, it } from "vitest";
import { isPasswordEnabled, SESSION_TTL_MS } from "./auth-settings";

describe("auth settings", () => {
  const original = process.env.ADMIN_PASSWORD_ENABLED;

  afterEach(() => {
    if (original === undefined) delete process.env.ADMIN_PASSWORD_ENABLED;
    else process.env.ADMIN_PASSWORD_ENABLED = original;
  });

  it("keeps sessions for 7 days", () => {
    expect(SESSION_TTL_MS).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it("enables password by default", () => {
    delete process.env.ADMIN_PASSWORD_ENABLED;
    expect(isPasswordEnabled()).toBe(true);
  });

  it("disables password from env", () => {
    process.env.ADMIN_PASSWORD_ENABLED = "false";
    expect(isPasswordEnabled()).toBe(false);
    process.env.ADMIN_PASSWORD_ENABLED = "0";
    expect(isPasswordEnabled()).toBe(false);
  });

  it("keeps password enabled for true-like values", () => {
    process.env.ADMIN_PASSWORD_ENABLED = "true";
    expect(isPasswordEnabled()).toBe(true);
  });
});
