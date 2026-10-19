import { priorityFromForm } from "@/lib/pushover-options";
import { DEFAULT_TIMEZONE } from "@/lib/schedule-form";

export class ReminderFormError extends Error {}

const localDateTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

/** Builds the POST /api/v1/reminders body from the create form; send_at stays local and the API applies timezone. */
export function reminderBody(formData: FormData) {
  const text = (key: string) => String(formData.get(key) || "").trim();
  const message = text("message");
  if (!message) throw new ReminderFormError("Escreva a mensagem do lembrete.");
  const sendAt = text("send_at");
  if (!localDateTime.test(sendAt)) throw new ReminderFormError("Escolha a data e o horário do lembrete.");
  return {
    message,
    title: text("title"),
    priority: priorityFromForm(formData.get("priority")),
    sound: text("sound"),
    send_at: sendAt,
    timezone: text("timezone") || DEFAULT_TIMEZONE,
  };
}

export function reminderApiErrorMessage(status: number, detail?: string) {
  if (status === 400 && detail?.includes("send_at is in the past")) return "O horário já passou. Escolha um horário futuro.";
  if (status === 400 && detail?.includes("message")) return "A mensagem é obrigatória e pode ter até 1024 caracteres.";
  if (status === 400 && detail?.includes("title")) return "O título pode ter até 250 caracteres.";
  if (status === 400) return "Dados inválidos. Confira mensagem, horário, prioridade e som.";
  if (status === 404) return "Lembrete não encontrado.";
  if (status === 409) return "Só lembretes pendentes podem ser alterados.";
  return "Não foi possível salvar agora. Tente novamente.";
}

/** Value for a datetime-local input in timezone, rounded up to the next 5 minutes. */
export function defaultSendAt(now: Date, timezone = DEFAULT_TIMEZONE) {
  const rounded = new Date(Math.ceil((now.getTime() + 60_000) / 300_000) * 300_000);
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(rounded).map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

/** Translates the delivery errors the API stores in last_error; Pushover's own messages pass through. */
export function deliveryErrorLabel(error: string) {
  if (error.includes("pushover is not configured")) return "Pushover não configurado.";
  if (error.includes("pushover is disabled")) return "Integração Pushover desativada.";
  if (error.includes("email credentials key")) return "Chave de credenciais ausente no servidor.";
  return error;
}
