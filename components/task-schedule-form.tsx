"use client";

import { useActionState, useState, useTransition } from "react";
import { LoaderCircle, Plus, Trash2 } from "lucide-react";
import {
  createTaskSchedule,
  deleteTaskSchedule,
  updateTaskSchedule,
  type ScheduleFormState,
} from "@/app/actions";
import { CompanySelect } from "@/components/company-select";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { contactName } from "@/lib/format";
import {
  buildCron,
  DEFAULT_TIMEZONE,
  describeCron,
  frequencyModes,
  hoursFromDueMinutes,
  parseCron,
  weekdays,
  type Frequency,
  type FrequencyMode,
} from "@/lib/schedule-form";
import type { Company, Contact, Conversation, TaskSchedule } from "@/lib/types";

const initialState: ScheduleFormState = {};
const inputClass = "focus-ring w-full rounded-xl border border-line px-3 py-2.5 text-sm";

export function TaskScheduleCreate({
  conversations,
  contacts,
  companies,
}: {
  conversations: Conversation[];
  contacts: Contact[];
  companies: Company[];
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="focus-ring mb-6 inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
      >
        <Plus size={16} />Nova recorrência
      </button>
    );
  }

  return (
    <section className="mb-6 rounded-2xl border border-line bg-white p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">Nova recorrência</h2>
        <button type="button" onClick={() => setOpen(false)} className="focus-ring rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-slate-100">
          Fechar
        </button>
      </div>
      <div className="mt-5">
        <TaskScheduleForm conversations={conversations} contacts={contacts} companies={companies} />
      </div>
    </section>
  );
}

export function TaskScheduleForm({
  schedule,
  conversations,
  contacts,
  companies,
}: {
  schedule?: TaskSchedule;
  conversations: Conversation[];
  contacts: Contact[];
  companies: Company[];
}) {
  const editing = Boolean(schedule);
  const [state, action, pending] = useActionState(editing ? updateTaskSchedule : createTaskSchedule, initialState);
  const [frequency, setFrequency] = useState<Frequency>(() => parseCron(schedule?.cron ?? "0 9 * * 1-5"));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, startDelete] = useTransition();
  const cron = buildCron(frequency);
  const update = (changes: Partial<Frequency>) => setFrequency((current) => ({ ...current, ...changes }));
  const needsTime = frequency.mode !== "hourly" && frequency.mode !== "custom";

  return (
    <>
      <form action={action} className="grid gap-4 sm:grid-cols-2">
        {schedule ? <input type="hidden" name="id" value={schedule.id} /> : null}
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1.5 block font-medium">Título da tarefa</span>
          <input name="title" required maxLength={500} defaultValue={schedule?.title} placeholder="Ex.: Revisar caixa de entrada" className={inputClass} />
        </label>

        <fieldset className="grid gap-3 rounded-xl border border-line p-4 sm:col-span-2 sm:grid-cols-3">
          <legend className="px-1 text-xs font-bold uppercase tracking-wider text-muted">Frequência</legend>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Repetir</span>
            <select
              name="frequency"
              value={frequency.mode}
              onChange={(event) => {
                const mode = event.target.value as FrequencyMode;
                update(mode === "custom" && !frequency.custom ? { mode, custom: cron ?? "" } : { mode });
              }}
              className={`${inputClass} bg-white`}
            >
              {frequencyModes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          {frequency.mode === "weekly" ? (
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium">Dia da semana</span>
              <select name="weekday" value={frequency.weekday} onChange={(event) => update({ weekday: event.target.value })} className={`${inputClass} bg-white`}>
                {weekdays.map((day, index) => <option key={day} value={String(index)}>{day}</option>)}
              </select>
            </label>
          ) : null}
          {frequency.mode === "monthly" ? (
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium">Dia do mês</span>
              <input name="month_day" type="number" min={1} max={31} required value={frequency.monthDay} onChange={(event) => update({ monthDay: event.target.value })} className={inputClass} />
            </label>
          ) : null}
          {needsTime ? (
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium">Horário</span>
              <input name="time" type="time" step={300} required value={frequency.time} onChange={(event) => update({ time: event.target.value })} className={inputClass} />
            </label>
          ) : null}
          {frequency.mode === "custom" ? (
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1.5 block font-medium">Expressão cron</span>
              <input
                name="cron"
                required
                value={frequency.custom}
                onChange={(event) => update({ custom: event.target.value })}
                placeholder="minuto hora dia mês dia-da-semana"
                className={`${inputClass} font-mono`}
              />
            </label>
          ) : null}
          <p className="text-xs text-muted sm:col-span-3">
            {cron ? <>{describeCron(cron)} · <code className="font-mono">{cron}</code>. </> : null}
            O agendador roda de 5 em 5 minutos: horários fora desse intervalo saem na rodada seguinte, e recorrências menores que 5 minutos não são aceitas.
          </p>
        </fieldset>

        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Fuso horário</span>
          <input name="timezone" defaultValue={schedule?.timezone ?? DEFAULT_TIMEZONE} placeholder={DEFAULT_TIMEZONE} className={inputClass} />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Prazo (horas após criar)</span>
          <input name="due_hours" inputMode="decimal" defaultValue={hoursFromDueMinutes(schedule?.due_in_minutes)} placeholder="Vazio = sem prazo" className={inputClass} />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Empresa</span>
          <CompanySelect companies={companies} defaultValue={schedule?.company_id} className={`${inputClass} bg-white`} />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Conversa (opcional)</span>
          <select name="conversation_id" defaultValue={schedule?.conversation_id || ""} className={`${inputClass} bg-white`}>
            <option value="">Nenhuma</option>
            {conversations.map((conversation) => (
              <option key={conversation.id} value={conversation.id}>{conversation.title || "Conversa sem título"}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1.5 block font-medium">Contato (opcional)</span>
          <select name="contact_id" defaultValue={schedule?.contact_id || ""} className={`${inputClass} bg-white`}>
            <option value="">Nenhum</option>
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contactName(contact)}{contact.phone ? ` · ${contact.phone}` : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1.5 block font-medium">Descrição</span>
          <textarea name="description" rows={3} maxLength={10000} defaultValue={schedule?.description || ""} placeholder="Detalhes copiados em cada tarefa criada" className={inputClass} />
        </label>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Checkbox name="skip_if_open" label="Não criar nova tarefa enquanto a anterior estiver aberta" defaultChecked={schedule?.skip_if_open ?? false} />
          <Checkbox name="enabled" label="Recorrência ativa" defaultChecked={schedule?.enabled ?? true} />
        </div>

        {state.error ? <p role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700 sm:col-span-2">{state.error}</p> : null}

        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <button disabled={pending} className="focus-ring inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
            {pending ? <LoaderCircle className="animate-spin" size={16} /> : null}
            {editing ? "Salvar alterações" : "Criar recorrência"}
          </button>
          {schedule ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="focus-ring inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50"
            >
              <Trash2 size={16} />Apagar
            </button>
          ) : null}
        </div>
      </form>
      {schedule ? (
        <ConfirmDialog
          open={confirmDelete}
          busy={deleting}
          title="Apagar recorrência?"
          description={`“${schedule.title}” deixará de criar tarefas. As tarefas já criadas são mantidas.`}
          confirmLabel="Apagar"
          cancelLabel="Cancelar"
          onCancel={() => { if (!deleting) setConfirmDelete(false); }}
          onConfirm={() => {
            startDelete(async () => {
              const formData = new FormData();
              formData.set("id", schedule.id);
              await deleteTaskSchedule(formData);
            });
          }}
        />
      ) : null}
    </>
  );
}

function Checkbox({ name, label, defaultChecked }: { name: string; label: string; defaultChecked: boolean }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm font-medium">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="size-4 accent-brand" />
      {label}
    </label>
  );
}
