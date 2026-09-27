"use client";

import { useActionState, useState, useTransition } from "react";
import { LoaderCircle, Plus, Trash2 } from "lucide-react";
import {
  createEmailAccount,
  deleteEmailAccount,
  updateEmailAccount,
  type EmailFormState,
} from "@/app/actions";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { emailPresets } from "@/lib/email-form";
import type { EmailAccount } from "@/lib/types";

const initialState: EmailFormState = {};
const inputClass = "focus-ring w-full rounded-xl border border-line px-3 py-2.5 text-sm";

export function EmailAccountCreate() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="focus-ring mb-6 inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
      >
        <Plus size={16} />Nova conta de e-mail
      </button>
    );
  }

  return (
    <section className="mb-6 rounded-2xl border border-line bg-white p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">Nova conta de e-mail</h2>
        <button type="button" onClick={() => setOpen(false)} className="focus-ring rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-slate-100">
          Fechar
        </button>
      </div>
      <div className="mt-5">
        <EmailAccountForm />
      </div>
    </section>
  );
}

export function EmailAccountForm({ account }: { account?: EmailAccount }) {
  const editing = Boolean(account);
  const [state, action, pending] = useActionState(editing ? updateEmailAccount : createEmailAccount, initialState);
  const [presetId, setPresetId] = useState("custom");
  const [imapHost, setImapHost] = useState(account?.imap_host ?? "");
  const [imapPort, setImapPort] = useState(String(account?.imap_port ?? 993));
  const [smtpHost, setSmtpHost] = useState(account?.smtp_host ?? "");
  const [smtpPort, setSmtpPort] = useState(String(account?.smtp_port ?? 465));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, startDelete] = useTransition();
  const preset = emailPresets.find((item) => item.id === presetId);

  function applyPreset(id: string) {
    setPresetId(id);
    const next = emailPresets.find((item) => item.id === id);
    if (!next || next.id === "custom") return;
    setImapHost(next.imapHost);
    setImapPort(String(next.imapPort));
    setSmtpHost(next.smtpHost);
    setSmtpPort(String(next.smtpPort));
  }

  return (
    <>
      <form action={action} className="grid gap-4 sm:grid-cols-2">
        {account ? <input type="hidden" name="id" value={account.id} /> : null}
        {!editing ? (
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1.5 block font-medium">Provedor</span>
            <select value={presetId} onChange={(event) => applyPreset(event.target.value)} className={`${inputClass} bg-white`}>
              {emailPresets.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
            {preset?.hint ? <p className="mt-1.5 text-xs text-muted">{preset.hint}</p> : null}
          </label>
        ) : null}
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Nome</span>
          <input name="name" required maxLength={200} defaultValue={account?.name} placeholder="Ex.: Comercial" className={inputClass} />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Endereço de e-mail</span>
          <input name="address" type="email" required defaultValue={account?.address} placeholder="voce@empresa.com" className={inputClass} />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Usuário</span>
          <input name="username" defaultValue={account?.username} placeholder="Vazio = mesmo do endereço" autoComplete="off" className={inputClass} />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Senha</span>
          <input
            name="password"
            type="password"
            required={!editing}
            autoComplete="new-password"
            placeholder={editing ? "Vazio = manter a atual" : "Senha ou senha de app"}
            className={inputClass}
          />
        </label>

        <fieldset className="grid gap-3 rounded-xl border border-line p-4 sm:col-span-2 sm:grid-cols-[1fr_7rem_auto] sm:items-end">
          <legend className="px-1 text-xs font-bold uppercase tracking-wider text-muted">IMAP (leitura)</legend>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Servidor</span>
            <input name="imap_host" required value={imapHost} onChange={(event) => setImapHost(event.target.value)} placeholder="imap.empresa.com" className={inputClass} />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Porta</span>
            <input name="imap_port" type="number" min={1} max={65535} required value={imapPort} onChange={(event) => setImapPort(event.target.value)} className={inputClass} />
          </label>
          <Checkbox name="imap_use_tls" label="TLS" defaultChecked={account?.imap_use_tls ?? true} />
        </fieldset>

        <fieldset className="grid gap-3 rounded-xl border border-line p-4 sm:col-span-2 sm:grid-cols-[1fr_7rem_auto] sm:items-end">
          <legend className="px-1 text-xs font-bold uppercase tracking-wider text-muted">SMTP (envio)</legend>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Servidor</span>
            <input name="smtp_host" required value={smtpHost} onChange={(event) => setSmtpHost(event.target.value)} placeholder="smtp.empresa.com" className={inputClass} />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Porta</span>
            <input name="smtp_port" type="number" min={1} max={65535} required value={smtpPort} onChange={(event) => setSmtpPort(event.target.value)} className={inputClass} />
          </label>
          <Checkbox name="smtp_use_tls" label="TLS" defaultChecked={account?.smtp_use_tls ?? true} />
        </fieldset>
        <p className="-mt-2 text-xs text-muted sm:col-span-2">
          Com TLS: IMAP 143 e SMTP 587 usam STARTTLS; as demais portas usam TLS direto (993/465).
        </p>

        {editing ? (
          <div className="sm:col-span-2">
            <Checkbox name="save_sent_copy" label="Salvar cópia dos enviados na pasta Enviados" defaultChecked={account?.save_sent_copy ?? true} />
          </div>
        ) : (
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1.5 block font-medium">Cópia na pasta Enviados</span>
            <select name="save_sent_copy" defaultValue="auto" className={`${inputClass} bg-white`}>
              <option value="auto">Automático (desligado para Gmail e Microsoft 365, que já salvam)</option>
              <option value="yes">Sempre salvar</option>
              <option value="no">Não salvar</option>
            </select>
          </label>
        )}
        <div className="sm:col-span-2">
          <Checkbox name="enabled" label="Conta ativa (disponível para os agentes via MCP)" defaultChecked={account?.enabled ?? true} />
        </div>

        {state.error ? <p role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700 sm:col-span-2">{state.error}</p> : null}

        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <button disabled={pending} className="focus-ring inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
            {pending ? <LoaderCircle className="animate-spin" size={16} /> : null}
            {editing ? "Salvar alterações" : "Cadastrar conta"}
          </button>
          {account ? (
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
      {account ? (
        <ConfirmDialog
          open={confirmDelete}
          busy={deleting}
          title="Apagar conta de e-mail?"
          description={`“${account.name}” (${account.address}) será removida do Contexta. Nenhum e-mail é apagado no servidor.`}
          confirmLabel="Apagar"
          cancelLabel="Cancelar"
          onCancel={() => { if (!deleting) setConfirmDelete(false); }}
          onConfirm={() => {
            startDelete(async () => {
              const formData = new FormData();
              formData.set("id", account.id);
              await deleteEmailAccount(formData);
            });
          }}
        />
      ) : null}
    </>
  );
}

function Checkbox({ name, label, defaultChecked }: { name: string; label: string; defaultChecked: boolean }) {
  return (
    <label className="inline-flex h-10 items-center gap-2 text-sm font-medium">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="size-4 accent-brand" />
      {label}
    </label>
  );
}
