"use client";

import { useActionState, useState, useTransition } from "react";
import { BellPlus, Check, LoaderCircle, Trash2 } from "lucide-react";
import { createReminder, deleteReminder, type ReminderFormState } from "@/app/actions";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { SoundOptions } from "@/components/pushover-forms";
import { pushoverPriorities } from "@/lib/pushover-options";
import { DEFAULT_TIMEZONE } from "@/lib/schedule-form";
import type { PushoverSound } from "@/lib/types";

const initialState: ReminderFormState = {};
const inputClass = "focus-ring w-full rounded-xl border border-line px-3 py-2.5 text-sm";

export function ReminderCreateForm({ sounds, defaultSendAt, disabled }: { sounds: PushoverSound[]; defaultSendAt: string; disabled: boolean }) {
  const [state, action, pending] = useActionState(createReminder, initialState);
  return (
    <section className="mb-6 rounded-2xl border border-line bg-white p-6">
      <div className="flex items-start gap-3">
        <span className="grid size-11 place-items-center rounded-xl bg-sky-50 text-sky-700"><BellPlus size={20} /></span>
        <div><h2 className="font-semibold">Novo lembrete</h2><p className="mt-1 text-sm text-muted">Uma notificação no Pushover no horário escolhido.</p></div>
      </div>
      {/* Remount after each create so the fields reset. */}
      <form key={state.created ?? 0} action={action} className="mt-6 grid gap-4 sm:grid-cols-2">
        <input type="hidden" name="timezone" value={DEFAULT_TIMEZONE} />
        <label className="block text-sm sm:col-span-2"><span className="mb-1.5 block font-medium">Mensagem</span><textarea name="message" required maxLength={1024} rows={3} className={inputClass} placeholder="Ex.: Ir ao banheiro" /></label>
        <label className="block text-sm"><span className="mb-1.5 block font-medium">Quando</span><input name="send_at" type="datetime-local" required defaultValue={defaultSendAt} className={inputClass} /></label>
        <label className="block text-sm"><span className="mb-1.5 block font-medium">Título (opcional)</span><input name="title" maxLength={250} className={inputClass} placeholder="Contexta" /></label>
        <label className="block text-sm"><span className="mb-1.5 block font-medium">Prioridade</span><select name="priority" defaultValue="0" className={`${inputClass} bg-white`}>{pushoverPriorities.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <label className="block text-sm"><span className="mb-1.5 block font-medium">Som</span><select name="sound" defaultValue="" className={`${inputClass} bg-white`}><SoundOptions sounds={sounds} /></select></label>
        <p className="text-xs text-muted sm:col-span-2">Horário de Brasília ({DEFAULT_TIMEZONE}). O envio acontece em até um minuto após o horário; se falhar, tenta mais duas vezes.</p>
        {state.error ? <p role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700 sm:col-span-2">{state.error}</p> : null}
        {state.created ? <p role="status" className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700 sm:col-span-2"><Check size={16} />Lembrete agendado.</p> : null}
        <div className="sm:col-span-2">
          <button disabled={pending || disabled} className="focus-ring inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60">
            {pending ? <LoaderCircle className="animate-spin" size={16} /> : <BellPlus size={16} />}Agendar lembrete
          </button>
        </div>
      </form>
    </section>
  );
}

export function ReminderDeleteButton({ id, pending }: { id: string; pending: boolean }) {
  const [open, setOpen] = useState(false);
  const [busy, startDelete] = useTransition();
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
      >
        <Trash2 size={14} />{pending ? "Cancelar" : "Apagar"}
      </button>
      <ConfirmDialog
        open={open}
        busy={busy}
        title={pending ? "Cancelar lembrete?" : "Apagar lembrete?"}
        description={pending ? "A notificação não será enviada." : "O registro do lembrete será apagado."}
        confirmLabel={pending ? "Cancelar lembrete" : "Apagar"}
        cancelLabel="Voltar"
        onCancel={() => { if (!busy) setOpen(false); }}
        onConfirm={() => {
          startDelete(async () => {
            const formData = new FormData();
            formData.set("id", id);
            await deleteReminder(formData);
          });
        }}
      />
    </>
  );
}
