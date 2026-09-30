export const DEFAULT_TIMEZONE = "America/Sao_Paulo";

export type FrequencyMode = "daily" | "weekdays" | "weekly" | "monthly" | "hourly" | "custom";

export type Frequency = {
  mode: FrequencyMode;
  time: string; // HH:MM
  weekday: string; // 0 (domingo) – 6 (sábado)
  monthDay: string; // 1 – 31
  custom: string;
};

export const frequencyModes: { value: FrequencyMode; label: string }[] = [
  { value: "daily", label: "Todo dia" },
  { value: "weekdays", label: "Dias úteis (seg–sex)" },
  { value: "weekly", label: "Toda semana" },
  { value: "monthly", label: "Todo mês" },
  { value: "hourly", label: "A cada hora" },
  { value: "custom", label: "Cron personalizado" },
];

export const weekdays = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

const descriptorLabels: Record<string, string> = {
  "@yearly": "Todo ano em 1º de janeiro à 00:00",
  "@annually": "Todo ano em 1º de janeiro à 00:00",
  "@monthly": "Todo dia 1 à 00:00",
  "@weekly": "Todo domingo à 00:00",
  "@daily": "Todo dia à 00:00",
  "@midnight": "Todo dia à 00:00",
  "@hourly": "A cada hora",
};

const defaultFrequency: Frequency = { mode: "weekdays", time: "09:00", weekday: "1", monthDay: "1", custom: "" };

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function parseTime(time: string): [number, number] | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return [hour, minute];
}

function isInt(value: string, min: number, max: number) {
  if (!/^\d{1,2}$/.test(value)) return false;
  const parsed = Number(value);
  return parsed >= min && parsed <= max;
}

/** Builds a 5-field cron expression; returns null when the inputs are incomplete. */
export function buildCron(frequency: Frequency): string | null {
  if (frequency.mode === "custom") return frequency.custom.trim() || null;
  if (frequency.mode === "hourly") return "0 * * * *";
  const time = parseTime(frequency.time);
  if (!time) return null;
  const [hour, minute] = time;
  switch (frequency.mode) {
    case "daily":
      return `${minute} ${hour} * * *`;
    case "weekdays":
      return `${minute} ${hour} * * 1-5`;
    case "weekly":
      return isInt(frequency.weekday, 0, 6) ? `${minute} ${hour} * * ${Number(frequency.weekday)}` : null;
    case "monthly":
      return isInt(frequency.monthDay, 1, 31) ? `${minute} ${hour} ${Number(frequency.monthDay)} * *` : null;
  }
}

/** Reverses buildCron so the edit form can show the friendly picker; anything else is custom. */
export function parseCron(cron: string): Frequency {
  const expression = cron.trim().replace(/\s+/g, " ");
  const custom = { ...defaultFrequency, mode: "custom" as const, custom: expression };
  if (expression === "0 * * * *") return { ...defaultFrequency, mode: "hourly" };
  const parts = expression.split(" ");
  if (parts.length !== 5) return custom;
  const [minute, hour, dom, month, dow] = parts;
  if (!isInt(minute, 0, 59) || !isInt(hour, 0, 23) || month !== "*") return custom;
  const time = `${pad(Number(hour))}:${pad(Number(minute))}`;
  if (dom === "*" && dow === "*") return { ...defaultFrequency, mode: "daily", time };
  if (dom === "*" && dow === "1-5") return { ...defaultFrequency, mode: "weekdays", time };
  if (dom === "*" && isInt(dow, 0, 6)) return { ...defaultFrequency, mode: "weekly", time, weekday: String(Number(dow)) };
  if (dow === "*" && isInt(dom, 1, 31)) return { ...defaultFrequency, mode: "monthly", time, monthDay: String(Number(dom)) };
  return custom;
}

export function describeCron(cron: string) {
  const descriptor = descriptorLabels[cron.trim().toLowerCase()];
  if (descriptor) return descriptor;
  const frequency = parseCron(cron);
  switch (frequency.mode) {
    case "daily":
      return `Todo dia às ${frequency.time}`;
    case "weekdays":
      return `Dias úteis às ${frequency.time}`;
    case "weekly": {
      const day = weekdays[Number(frequency.weekday)];
      const article = day === "sábado" || day === "domingo" ? "Todo" : "Toda";
      return `${article} ${day} às ${frequency.time}`;
    }
    case "monthly":
      return `Todo dia ${frequency.monthDay} às ${frequency.time}`;
    case "hourly":
      return "A cada hora";
    default:
      return `Cron ${frequency.custom}`;
  }
}

export function frequencyFromForm(formData: FormData): Frequency {
  const text = (key: string) => String(formData.get(key) || "").trim();
  const mode = text("frequency") as FrequencyMode;
  return {
    mode: frequencyModes.some((item) => item.value === mode) ? mode : "custom",
    time: text("time"),
    weekday: text("weekday"),
    monthDay: text("month_day"),
    custom: text("cron"),
  };
}

/** Hours field → minutes; empty means no due date. Returns undefined when invalid. */
export function dueMinutesFromHours(value: string): number | null | undefined {
  const trimmed = value.trim().replace(",", ".");
  if (!trimmed) return null;
  const hours = Number(trimmed);
  if (!Number.isFinite(hours) || hours <= 0) return undefined;
  return Math.max(1, Math.round(hours * 60));
}

export function hoursFromDueMinutes(minutes?: number | null) {
  if (!minutes) return "";
  const hours = minutes / 60;
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(2).replace(/\.?0+$/, "");
}

export class ScheduleFormError extends Error {}

export function scheduleBody(formData: FormData, editing: boolean) {
  const text = (key: string) => String(formData.get(key) || "").trim();
  const cron = buildCron(frequencyFromForm(formData));
  if (!cron) throw new ScheduleFormError("Preencha a frequência: horário, dia ou expressão cron.");
  const dueInMinutes = dueMinutesFromHours(text("due_hours"));
  if (dueInMinutes === undefined) throw new ScheduleFormError("O prazo deve ser um número de horas maior que zero.");

  const body = {
    cron,
    timezone: text("timezone") || DEFAULT_TIMEZONE,
    title: text("title"),
    description: text("description"),
    company_id: text("company_id"),
    conversation_id: text("conversation_id"),
    contact_id: text("contact_id"),
    skip_if_open: formData.get("skip_if_open") === "on",
    enabled: formData.get("enabled") === "on",
  };
  if (editing) return { ...body, due_in_minutes: dueInMinutes ?? 0 };
  return dueInMinutes ? { ...body, due_in_minutes: dueInMinutes } : body;
}

export function scheduleApiErrorMessage(status: number, detail?: string) {
  if (status === 400 && detail?.includes("invalid cron expression")) {
    if (detail.includes("more often")) return "A recorrência não pode ser menor que 5 minutos: o agendador roda de 5 em 5 minutos.";
    if (detail.includes("timezone")) return "Fuso horário desconhecido. Use um nome IANA, como America/Sao_Paulo.";
    return "Expressão cron inválida. Use 5 campos (minuto hora dia mês dia-da-semana), ex.: 0 9 * * 1-5.";
  }
  if (status === 400) return "Dados inválidos. Confira título, frequência e prazo.";
  if (status === 404) return "Recorrência, empresa, conversa ou contato não encontrado.";
  return "Não foi possível salvar agora. Tente novamente.";
}
