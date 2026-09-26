"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteTask, updateTask } from "@/app/actions";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { contactName } from "@/lib/format";
import type { Contact, Conversation, Task } from "@/lib/types";

const statuses = [
  { value: "pending", label: "Pendente" },
  { value: "in_progress", label: "Em andamento" },
  { value: "done", label: "Concluída" },
  { value: "cancelled", label: "Cancelada" },
] as const;

function dueDateInputValue(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "";
  return date.toISOString().slice(0, 10);
}

export function TaskEditForm({
  task,
  conversations,
  contacts,
}: {
  task: Task;
  conversations: Conversation[];
  contacts: Contact[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <form action={updateTask} className="grid gap-4 sm:grid-cols-2">
        <input type="hidden" name="id" value={task.id} />
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1.5 block font-medium">Título</span>
          <input name="title" required maxLength={500} defaultValue={task.title} className="focus-ring w-full rounded-xl border border-line px-3 py-2.5 text-sm" />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Empresa</span>
          <input name="company" maxLength={200} defaultValue={task.company || ""} className="focus-ring w-full rounded-xl border border-line px-3 py-2.5 text-sm" />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Status</span>
          <select name="status" defaultValue={task.status} className="focus-ring w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm">
            {statuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Prazo / data fim</span>
          <input name="due_at" type="date" defaultValue={dueDateInputValue(task.due_at)} className="focus-ring w-full rounded-xl border border-line px-3 py-2.5 text-sm" />
          <p className="mt-1.5 text-xs text-muted">Ao marcar como concluída, a data fim vira o momento da conclusão.</p>
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Conversa</span>
          <select name="conversation_id" defaultValue={task.conversation_id || ""} className="focus-ring w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm">
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
          <select name="contact_id" defaultValue={task.contact_id || ""} className="focus-ring w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm">
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
          <textarea name="description" rows={4} maxLength={10000} defaultValue={task.description || ""} className="focus-ring w-full rounded-xl border border-line px-3 py-2.5 text-sm" />
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
        title="Apagar tarefa?"
        description={`“${task.title}” será removida permanentemente.`}
        confirmLabel="Apagar"
        cancelLabel="Cancelar"
        onCancel={() => { if (!pending) setOpen(false); }}
        onConfirm={() => {
          startTransition(async () => {
            const formData = new FormData();
            formData.set("id", task.id);
            await deleteTask(formData);
          });
        }}
      />
    </>
  );
}
