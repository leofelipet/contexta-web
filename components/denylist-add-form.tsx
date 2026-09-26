"use client";

import { useMemo, useState } from "react";
import { Ban } from "lucide-react";
import { addDenylistEntry } from "@/app/actions";
import { contactName } from "@/lib/format";
import type { Contact, Conversation } from "@/lib/types";

export function DenylistAddForm({
  conversations,
  contacts,
  blockedConversationIds,
  blockedContactIds,
}: {
  conversations: Conversation[];
  contacts: Contact[];
  blockedConversationIds: string[];
  blockedContactIds: string[];
}) {
  const [targetType, setTargetType] = useState<"conversation" | "contact">("conversation");
  const blockedConversations = useMemo(() => new Set(blockedConversationIds), [blockedConversationIds]);
  const blockedContacts = useMemo(() => new Set(blockedContactIds), [blockedContactIds]);

  const conversationOptions = conversations.filter((item) => !blockedConversations.has(item.id));
  const contactOptions = contacts.filter((item) => !blockedContacts.has(item.id));

  return (
    <section className="mb-6 rounded-2xl border border-line bg-white p-6">
      <div className="flex items-center gap-2"><Ban size={18} className="text-brand" /><h2 className="font-semibold">Adicionar bloqueio</h2></div>
      <p className="mt-2 text-sm text-muted">Escolha uma conversa/grupo ou um contato já identificados. Contatos bloqueiam só a conversa direta.</p>
      <form action={addDenylistEntry} className="mt-5 grid gap-4 sm:grid-cols-[160px_1fr_1fr_auto]">
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Tipo</span>
          <select
            name="target_type"
            required
            value={targetType}
            onChange={(event) => setTargetType(event.target.value as "conversation" | "contact")}
            className="focus-ring w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm"
          >
            <option value="conversation">Conversa / grupo</option>
            <option value="contact">Contato (direto)</option>
          </select>
        </label>

        {targetType === "conversation" ? (
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Conversa</span>
            <select key="conversation" name="target_id" required defaultValue="" className="focus-ring w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm">
              <option value="" disabled>Selecione uma conversa</option>
              {conversationOptions.map((conversation) => {
                const label = conversation.title || "Conversa sem título";
                const kind = conversation.type === "group" ? "Grupo" : conversation.type === "direct" ? "Direta" : conversation.type;
                return <option key={conversation.id} value={conversation.id}>{label} · {kind}</option>;
              })}
            </select>
            {!conversationOptions.length && <p className="mt-1.5 text-xs text-muted">Nenhuma conversa disponível para bloquear.</p>}
          </label>
        ) : (
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Contato</span>
            <select key="contact" name="target_id" required defaultValue="" className="focus-ring w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm">
              <option value="" disabled>Selecione um contato</option>
              {contactOptions.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contactName(contact)}{contact.phone ? ` · ${contact.phone}` : ""}
                </option>
              ))}
            </select>
            {!contactOptions.length && <p className="mt-1.5 text-xs text-muted">Nenhum contato disponível para bloquear.</p>}
          </label>
        )}

        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Motivo (opcional)</span>
          <input name="reason" placeholder="Ex.: grupo de spam" className="focus-ring w-full rounded-xl border border-line px-3 py-2.5 text-sm" />
        </label>
        <div className="flex items-end">
          <button className="focus-ring w-full rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark sm:w-auto">Bloquear</button>
        </div>
      </form>
    </section>
  );
}
