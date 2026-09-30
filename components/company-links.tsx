"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Link2Off } from "lucide-react";
import { attachCompanyContact, detachCompanyContact, setCompanyTask } from "@/app/actions";
import { Badge } from "@/components/ui";
import { contactName, formatDate } from "@/lib/format";
import type { Contact, Task } from "@/lib/types";

const statusLabel: Record<string, string> = {
  pending: "Pendente",
  in_progress: "Em andamento",
  blocked: "Bloqueada",
  done: "Concluída",
  cancelled: "Cancelada",
};

const selectClass = "focus-ring w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm";
const attachButtonClass = "focus-ring w-full rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark sm:w-auto";
const detachButtonClass = "focus-ring inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60";

export function CompanyTasksSection({
  companyId,
  linked,
  candidates,
}: {
  companyId: string;
  linked: Task[];
  candidates: Task[];
}) {
  const [pending, startTransition] = useTransition();
  const available = candidates.filter((task) => task.company_id !== companyId);

  return (
    <section className="mt-6 rounded-2xl border border-line bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">Tarefas</h2>
        <Link href={`/tarefas?company=${encodeURIComponent(companyId)}&closed=1`} className="text-sm font-medium text-muted hover:text-ink">
          Ver na lista de tarefas
        </Link>
      </div>

      {linked.length ? (
        <ul className="mt-4 divide-y divide-line rounded-xl border border-line">
          {linked.map((task) => (
            <li key={task.id} className="flex flex-wrap items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <Link href={`/tarefas/${encodeURIComponent(task.id)}`} className="text-sm font-semibold hover:underline">
                  #{task.id} - {task.title}
                </Link>
                <p className="text-xs text-muted">{task.due_at ? `Prazo ${formatDate(task.due_at, false)}` : "Sem prazo"}</p>
              </div>
              <Badge tone={task.status === "done" ? "success" : "neutral"}>{statusLabel[task.status] || task.status}</Badge>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  startTransition(async () => {
                    const formData = new FormData();
                    formData.set("page_company_id", companyId);
                    formData.set("task_id", task.id);
                    formData.set("company_id", "");
                    await setCompanyTask(formData);
                  });
                }}
                className={detachButtonClass}
              >
                <Link2Off size={14} />Desvincular
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted">Nenhuma tarefa vinculada ainda.</p>
      )}

      <form action={setCompanyTask} className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
        <input type="hidden" name="page_company_id" value={companyId} />
        <input type="hidden" name="company_id" value={companyId} />
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Vincular tarefa existente</span>
          <select name="task_id" required defaultValue="" className={selectClass}>
            <option value="" disabled>Selecione uma tarefa aberta</option>
            {available.map((task) => (
              <option key={task.id} value={task.id}>
                #{task.id} - {task.title}{task.company_name ? ` · hoje em ${task.company_name}` : ""}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <button className={attachButtonClass}>Vincular</button>
        </div>
      </form>
    </section>
  );
}

export function CompanyContactsSection({
  companyId,
  linked,
  candidates,
}: {
  companyId: string;
  linked: Contact[];
  candidates: Contact[];
}) {
  const [pending, startTransition] = useTransition();
  const available = candidates.filter((contact) => contact.company_id !== companyId);

  return (
    <section className="mt-6 rounded-2xl border border-line bg-white p-6">
      <h2 className="font-semibold">Contatos</h2>
      <p className="mt-1 text-sm text-muted">Tarefas novas vinculadas a um destes contatos já nascem com esta empresa.</p>

      {linked.length ? (
        <ul className="mt-4 divide-y divide-line rounded-xl border border-line">
          {linked.map((contact) => (
            <li key={contact.id} className="flex flex-wrap items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <Link href={`/contacts/${encodeURIComponent(contact.id)}`} className="text-sm font-semibold hover:underline">
                  {contactName(contact)}
                </Link>
                <p className="text-xs text-muted">{contact.phone || "Telefone não informado"}</p>
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  startTransition(async () => {
                    const formData = new FormData();
                    formData.set("company_id", companyId);
                    formData.set("contact_id", contact.id);
                    await detachCompanyContact(formData);
                  });
                }}
                className={detachButtonClass}
              >
                <Link2Off size={14} />Desvincular
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted">Nenhum contato vinculado ainda.</p>
      )}

      <form action={attachCompanyContact} className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
        <input type="hidden" name="company_id" value={companyId} />
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Vincular contato</span>
          <select name="contact_id" required defaultValue="" className={selectClass}>
            <option value="" disabled>Selecione um contato</option>
            {available.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contactName(contact)}{contact.phone ? ` · ${contact.phone}` : ""}{contact.company_name ? ` · hoje em ${contact.company_name}` : ""}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <button className={attachButtonClass}>Vincular</button>
        </div>
      </form>
    </section>
  );
}
