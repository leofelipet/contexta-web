import { describe, expect, it } from "vitest";
import { contactName, initials } from "./format";

describe("format utilities", () => {
  it("uses a stable contact fallback order", () => {
    expect(contactName({ push_name: "Ana", phone: "5511" })).toBe("Ana");
    expect(contactName(null)).toBe("Contato sem nome");
  });
  it("creates at most two initials", () => expect(initials("Ana Maria Silva")).toBe("AM"));
});
