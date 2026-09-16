export function formatDate(value?: string | null, withTime = true) {
  if (!value) return "Não disponível";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "Não disponível";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "short", year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
    hour: withTime ? "2-digit" : undefined, minute: withTime ? "2-digit" : undefined,
  }).format(date);
}

export function initials(name?: string | null) {
  return (name || "Contato").trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export function contactName(contact?: { name?: string | null; push_name?: string | null; phone?: string | null } | null) {
  return contact?.name || contact?.push_name || contact?.phone || "Contato sem nome";
}
