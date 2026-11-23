import { describe, expect, it } from "vitest";
import { mcpKeyBody, mcpKeyErrorMessage } from "./mcp-key-form";

describe("mcp key form", () => {
  it("keeps tools only for custom access and computes expiry on create", () => {
    const data = new FormData();
    data.set("name", " Claude Desktop ");
    data.set("access", "custom");
    data.append("tools", "get_task");
    data.append("tools", "create_task");
    data.set("validity", "30");
    expect(mcpKeyBody(data, true, 0)).toEqual({
      name: "Claude Desktop", access: "custom", tools: ["get_task", "create_task"],
      expires_at: new Date(30 * 24 * 60 * 60 * 1000).toISOString(),
    });
    data.set("access", "read");
    data.set("validity", "");
    expect(mcpKeyBody(data, true)).toEqual({ name: "Claude Desktop", access: "read", tools: [] });
    data.set("validity", "90");
    expect(mcpKeyBody(data).expires_at).toBeUndefined();
  });

  it("maps API errors", () => {
    expect(mcpKeyErrorMessage("invalid argument: custom access needs at least one tool")).toContain("ferramenta");
    expect(mcpKeyErrorMessage(undefined)).toContain("Tente novamente");
  });
});
