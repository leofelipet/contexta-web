export const pushoverPriorities: { value: number; label: string }[] = [
  { value: -2, label: "Silenciosa" },
  { value: -1, label: "Baixa" },
  { value: 0, label: "Normal" },
  { value: 1, label: "Alta" },
  { value: 2, label: "Emergência (repete até confirmar)" },
];

export function priorityLabel(priority: number) {
  return pushoverPriorities.find((item) => item.value === priority)?.label ?? String(priority);
}

/** Form value → API priority; anything outside -2..2 falls back to normal. */
export function priorityFromForm(value: FormDataEntryValue | null) {
  const priority = Number(value ?? 0);
  return Number.isInteger(priority) && priority >= -2 && priority <= 2 ? priority : 0;
}
