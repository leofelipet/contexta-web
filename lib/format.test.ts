import { describe, expect, it } from "vitest";
import { contactName, formatBytes, formatDate, formatUptime, initials } from "./format";

describe("format utilities", () => {
  it("uses a stable contact fallback order", () => {
    expect(contactName({ push_name: "Ana", phone: "5511" })).toBe("Ana");
    expect(contactName(null)).toBe("Contato sem nome");
  });
  it("creates at most two initials", () => expect(initials("Ana Maria Silva")).toBe("AM"));
  it("formats byte sizes", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1536)).toBe("1,5 KB");
  });
  it("formats uptime from started_at", () => {
    const now = new Date("2026-09-26T12:00:00Z");
    expect(formatUptime("2026-09-26T10:30:00Z", now)).toBe("1h 30min");
  });
  it("formats timestamps in America/Sao_Paulo", () => {
    expect(formatDate("2026-10-10T18:18:00.000Z")).toMatch(/15:18/);
    expect(formatDate("2026-10-10T18:18:00.000Z")).not.toMatch(/18:18/);
  });
});
