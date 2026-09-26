"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteMemory, updateMemory } from "@/app/actions";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { contactName } from "@/lib/format";
import type { Contact, Conversation, Memory } from "@/lib/types";

export function MemoryEditForm({
  memory,
  conversations,
  contacts,
}: {
  memory: Memory;
  conversations: Conversation[];
  contacts: Contact[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <form action={updateMemory} className="grid gap-4 sm:grid-cols-2">
        <input type="hidden" name="id" value={memory.id} />
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1.5 block font-medium">Título</span>
          <input name="title" maxLength={500} defaultValue={memory.title || ""} className="focus-ring w-full rounded-xl border border-line px-3 py-2.5 text-sm" />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1.5 block font-medium">Conteúdo</span>
          <textarea name="content" required rows={6} maxLength={12000} defaultValue={memory.content} className="focus-ring w-full rounded-xl border border-line px-3 py-2.5 text-sm" />
          <p className="mt-1.5 text-xs text-muted">Alterar o conteúdo gera um novo embedding.</p>
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Conversa</span>
          <select name="conversation_id" defaultValue={memory.conversation_id || ""} className="focus-ring w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm">
            <option value="">Nenhuma</option>
            {conversations.map((conversation) => (
              <option key={conversation.id} value={conversation.id}>
                {conversation.title || "Conversa sem título"}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Contato</span>
          <select name="contact_id" defaultValue={memory.contact_id || ""} className="focus-ring w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm">
            <option value="">Nenhum</option>
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contactName(contact)}{contact.phone ? ` · ${contact.phone}` : ""}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <button className="focus-ring rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">Salvar</button>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="focus-ring inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50"
          >
            <Trash2 size={16} />Apagar
          </button>
        </div>
      </form>
      <ConfirmDialog
        open={open}
        busy={pending}
        title="Apagar memória?"
        description={`“${memory.title || "Sem título"}” será removida permanentemente.`}
        confirmLabel="Apagar"
        cancelLabel="Cancelar"
        onCancel={() => { if (!pending) setOpen(false); }}
        onConfirm={() => {
          startTransition(async () => {
            const formData = new FormData();
            formData.set("id", memory.id);
            await deleteMemory(formData);
          });
        }}
      />
    </>
  );
}
