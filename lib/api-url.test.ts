import { describe, expect, it } from "vitest";
import { allowMessageParams, buildApiUrl } from "./api-url";

describe("buildApiUrl", () => {
  it("normalizes paths and omits empty filters", () => {
    expect(buildApiUrl("https://api.test/root", "/api/v1/activity", { level: "error", cursor: "", limit: 25 }).toString())
      .toBe("https://api.test/root/api/v1/activity?level=error&limit=25");
  });
});

describe("allowMessageParams", () => {
  it("only forwards pagination parameters", () => {
    expect(allowMessageParams(new URLSearchParams("cursor=abc&limit=20&token=secret")))
      .toEqual({ cursor: "abc", limit: "20" });
  });
});
