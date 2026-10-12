"use client";

import { useActionState, useEffect } from "react";
import { BellRing, Check, LoaderCircle, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { configurePushover, sendPushover, type PushoverFormState } from "@/app/actions";
import type { PushoverIntegration } from "@/lib/types";

const initialState: PushoverFormState = {};
const inputClass = "focus-ring w-full rounded-xl border border-line px-3 py-2.5 text-sm";

export function PushoverForms({ integration }: { integration: PushoverIntegration }) {
  const router = useRouter();
  const [settings, configureAction, configuring] = useActionState(configurePushover, initialState);
  const [notification, sendAction, sending] = useActionState(sendPushover, initialState);
  useEffect(() => {
    if (settings.saved) router.refresh();
  }, [router, settings.saved]);
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="rounded-2xl border border-line bg-white p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-brand-soft text-brand"><Save size={20} /></span>
          <div><h2 className="font-semibold">Credenciais</h2><p className="mt-1 text-sm text-muted">A chave da aplicação e o destinatário ficam cifrados no servidor.</p></div>
        </div>
        <form action={configureAction} className="mt-6 space-y-4">
          <label className="block text-sm"><span className="mb-1.5 block font-medium">Token da aplicação</span><input name="app_token" type="password" required={!integration.configured} autoComplete="new-password" placeholder={integration.configured ? "Vazio = manter o atual" : "Token da aplicação Pushover"} className={inputClass} /></label>
          <label className="block text-sm"><span className="mb-1.5 block font-medium">Chave do usuário ou grupo</span><input name="user_key" type="password" required={!integration.configured} autoComplete="new-password" placeholder={integration.configured ? "Vazio = manter a atual" : "User key ou group key"} className={inputClass} /></label>
          <label className="inline-flex items-center gap-2 text-sm font-medium"><input name="enabled" type="checkbox" defaultChecked={integration.enabled} className="size-4 accent-brand" />Integração ativa</label>
          {settings.error ? <p role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">{settings.error}</p> : null}
          {settings.saved ? <p role="status" className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700"><Check size={16} />Credenciais salvas.</p> : null}
          <button disabled={configuring} className="focus-ring inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60">{configuring ? <LoaderCircle className="animate-spin" size={16} /> : <Save size={16} />}Salvar integração</button>
        </form>
      </section>
      <section className="rounded-2xl border border-line bg-white p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-sky-50 text-sky-700"><BellRing size={20} /></span>
          <div><h2 className="font-semibold">Enviar notificação</h2><p className="mt-1 text-sm text-muted">Disparo imediato pelo mesmo canal disponível no MCP.</p></div>
        </div>
        <form action={sendAction} className="mt-6 space-y-4">
          <label className="block text-sm"><span className="mb-1.5 block font-medium">Mensagem</span><textarea name="message" required maxLength={1024} rows={5} className={inputClass} placeholder="O que você precisa saber?" /></label>
          <label className="block text-sm"><span className="mb-1.5 block font-medium">Título</span><input name="title" maxLength={250} className={inputClass} placeholder="Contexta" /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm"><span className="mb-1.5 block font-medium">Prioridade</span><select name="priority" defaultValue="0" className={`${inputClass} bg-white`}><option value="-2">Silenciosa</option><option value="-1">Baixa</option><option value="0">Normal</option><option value="1">Alta</option></select></label>
            <label className="block text-sm"><span className="mb-1.5 block font-medium">URL</span><input name="url" type="url" className={inputClass} placeholder="https://..." /></label>
          </div>
          {notification.error ? <p role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">{notification.error}</p> : null}
          {notification.sent ? <p role="status" className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700"><Check size={16} />Notificação enviada.</p> : null}
          <button disabled={sending || !integration.configured || !integration.enabled} className="focus-ring inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60">{sending ? <LoaderCircle className="animate-spin" size={16} /> : <BellRing size={16} />}Enviar agora</button>
          {!integration.configured ? <p className="text-xs text-muted">Salve as credenciais antes de enviar.</p> : null}
          {integration.configured && !integration.enabled ? <p className="text-xs text-muted">Ative a integração para enviar.</p> : null}
        </form>
      </section>
    </div>
  );
}
