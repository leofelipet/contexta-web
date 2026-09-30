import { describe, expect, it } from "vitest";
import { companyApiErrorMessage, companyBody, companyReturnPath } from "./company-form";

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe("company form", () => {
  it("trims name and notes", () => {
    expect(companyBody(form({ name: "  ACME ", notes: " cliente " }))).toEqual({ name: "ACME", notes: "cliente" });
    expect(companyBody(form({}))).toEqual({ name: "", notes: "" });
  });

  it("maps API errors", () => {
    expect(companyApiErrorMessage(409)).toContain("Já existe");
    expect(companyApiErrorMessage(400)).toContain("nome");
    expect(companyApiErrorMessage(500)).toContain("Tente novamente");
  });

  it("accepts only company pages as return paths", () => {
    expect(companyReturnPath("/empresas/12")).toBe("/empresas/12");
    expect(companyReturnPath("https://evil.example/empresas/12")).toBeNull();
    expect(companyReturnPath("/empresas/12/../../login")).toBeNull();
    expect(companyReturnPath(null)).toBeNull();
  });
});
