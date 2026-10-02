import { describe, expect, it } from "vitest";
import { bulkIds, countLabel, fillCount, MAX_BULK_IDS } from "./bulk";

describe("bulk helpers", () => {
  it("trims and dedupes ids", () => {
    expect(bulkIds([" 1", "2", "1", "", "  "])).toEqual(["1", "2"]);
  });

  it("rejects empty, oversized, and non-array selections", () => {
    expect(() => bulkIds([])).toThrow();
    expect(() => bulkIds(["  "])).toThrow();
    expect(() => bulkIds("1")).toThrow();
    expect(() => bulkIds(Array.from({ length: MAX_BULK_IDS + 1 }, (_, i) => String(i + 1)))).toThrow();
    expect(bulkIds(Array.from({ length: MAX_BULK_IDS }, (_, i) => String(i + 1)))).toHaveLength(MAX_BULK_IDS);
  });

  it("pluralizes counts", () => {
    const noun = ["tarefa", "tarefas"] as const;
    expect(countLabel(1, noun)).toBe("1 tarefa");
    expect(countLabel(3, noun)).toBe("3 tarefas");
    expect(fillCount("Apagar {n}?", 2, noun)).toBe("Apagar 2 tarefas?");
  });
});
