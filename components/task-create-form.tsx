"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { createTask } from "@/app/actions";
import { contactName } from "@/lib/format";
import type { Contact, Conversation } from "@/lib/types";

const statuses = [
  { value: "pending", label: "Pendente" },
  { value: "in_progress", label: "Em andamento" },
  { value: "blocked", label: "Bloqueada" },
  { value: "done", label: "Concluída" },
  { value: "cancelled", label: "Cancelada" },
] as const;

export function TaskCreateForm({
  conversations,
  contacts,
}: {
  conversations: Conversation[];
  contacts: Contact[];
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="focus-ring mb-6 inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
      >
        <Plus size={16} />Nova tarefa
      </button>
    );
  }

  return (
    <section className="mb-6 rounded-2xl border border-line bg-white p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">Nova tarefa</h2>
        <button type="button" onClick={() => setOpen(false)} className="focus-ring rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-slate-100">
          Fechar
        </button>
      </div>
      <form action={createTask} className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1.5 block font-medium">Título</span>
          <input name="title" required maxLength={500} placeholder="O que precisa ser feito" className="focus-ring w-full rounded-xl border border-line px-3 py-2.5 text-sm" />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Empresa</span>
          <input name="company" maxLength={200} placeholder="Texto livre" className="focus-ring w-full rounded-xl border border-line px-3 py-2.5 text-sm" />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Status</span>
          <select name="status" defaultValue="pending" className="focus-ring w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm">
            {statuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Prazo</span>
          <input name="due_at" type="date" className="focus-ring w-full rounded-xl border border-line px-3 py-2.5 text-sm" />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Conversa (opcional)</span>
          <select name="conversation_id" defaultValue="" className="focus-ring w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm">
            <option value="">Nenhuma</option>
            {conversations.map((conversation) => (
              <option key={conversation.id} value={conversation.id}>
                {conversation.title || "Conversa sem título"}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Contato (opcional)</span>
          <select name="contact_id" defaultValue="" className="focus-ring w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm">
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
          <textarea name="description" rows={3} maxLength={10000} placeholder="Detalhes da tarefa" className="focus-ring w-full rounded-xl border border-line px-3 py-2.5 text-sm" />
        </label>
        <div className="sm:col-span-2">
          <button className="focus-ring rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">Criar tarefa</button>
        </div>
      </form>
    </section>
  );
}
