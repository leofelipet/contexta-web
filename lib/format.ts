export const DISPLAY_TIMEZONE = "America/Sao_Paulo";

function yearInTimeZone(date: Date) {
  return Number(new Intl.DateTimeFormat("en-US", { timeZone: DISPLAY_TIMEZONE, year: "numeric" }).format(date));
}

export function formatDate(value?: string | null, withTime = true) {
  if (!value) return "Não disponível";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "Não disponível";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: DISPLAY_TIMEZONE,
    day: "2-digit",
    month: "short",
    year: yearInTimeZone(date) !== yearInTimeZone(new Date()) ? "numeric" : undefined,
    hour: withTime ? "2-digit" : undefined,
    minute: withTime ? "2-digit" : undefined,
    hour12: false,
  }).format(date);
}

export function formatBytes(value?: number | null) {
  if (value == null || Number.isNaN(value) || value < 0) return "—";
  if (value < 1024) return `${value} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let amount = value / 1024;
  let unit = units[0];
  for (let index = 1; index < units.length && amount >= 1024; index++) {
    amount /= 1024;
    unit = units[index];
  }
  return `${amount.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} ${unit}`;
}

export function formatUptime(startedAt?: string | null, now = new Date()) {
  if (!startedAt) return "—";
  const start = new Date(startedAt);
  if (Number.isNaN(start.valueOf())) return "—";
  const seconds = Math.max(0, Math.floor((now.valueOf() - start.valueOf()) / 1000));
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}min`;
  return `${minutes}min`;
}

export function initials(name?: string | null) {
  return (name || "Contato").trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export function contactName(contact?: { name?: string | null; push_name?: string | null; phone?: string | null } | null) {
  const phone = contact?.phone?.trim() || "";
  for (const value of [contact?.name, contact?.push_name]) {
    const name = value?.trim() || "";
    if (name && !isPlaceholderContactName(name, phone)) return name;
  }
  return phone || "Contato sem nome";
}

function isPlaceholderContactName(name: string, phone: string) {
  if (phone && name === phone) return true;
  if (name.includes("@")) return true;
  return /^\+?\d{8,}$/.test(name);
}
