/** Mirrors the API limit for one bulk request. */
export const MAX_BULK_IDS = 100;

export type BulkResult = { count: number };

/** Trims, dedupes, and validates the IDs sent to a bulk endpoint. */
export function bulkIds(ids: unknown): string[] {
  if (!Array.isArray(ids)) throw new Error("Seleção inválida.");
  const cleaned = [...new Set(ids.map((id) => String(id).trim()).filter(Boolean))];
  if (cleaned.length === 0 || cleaned.length > MAX_BULK_IDS) {
    throw new Error(`Selecione de 1 a ${MAX_BULK_IDS} itens.`);
  }
  return cleaned;
}

/** Formats "1 tarefa" / "3 tarefas" and fills {n} placeholders with it. */
export function countLabel(count: number, [one, many]: readonly [string, string]) {
  return `${count.toLocaleString("pt-BR")} ${count === 1 ? one : many}`;
}

export function fillCount(template: string, count: number, noun: readonly [string, string]) {
  return template.replaceAll("{n}", countLabel(count, noun));
}
