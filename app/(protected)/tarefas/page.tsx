import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { TaskCreateForm } from "@/components/task-create-form";
import { LiveCheckbox, LiveSearchInput, LiveSelect } from "@/components/live-filters";
import { Badge, EmptyState, PageHeader } from "@/components/ui";
import { apiFetch, itemsFrom } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Contact, Conversation, Paginated, Task } from "@/lib/types";

export const metadata: Metadata = { title: "Tarefas" };

const statusLabel: Record<string, string> = {
  pending: "Pendente",
  in_progress: "Em andamento",
  blocked: "Bloqueada",
  done: "Concluída",
  cancelled: "Cancelada",
};

function statusTone(status: string): "success" | "danger" | "neutral" | "warning" {
  if (status === "done") return "success";
  if (status === "cancelled") return "neutral";
  if (status === "in_progress") return "warning";
  if (status === "blocked") return "danger";
  return "neutral";
}

function isOverdue(task: Task) {
  if (!task.due_at) return false;
  if (task.status === "done" || task.status === "cancelled") return false;
  const due = new Date(task.due_at);
  return !Number.isNaN(due.valueOf()) && due.valueOf() < Date.now();
}

export default async function TarefasPage({
  searchParams,
}: {
  searchParams: Promise<{
    created?: string;
    deleted?: string;
    cursor?: string;
    status?: string;
    company?: string;
    overdue?: string;
    q?: string;
  }>;
}) {
  const query = await searchParams;
  const filters = {
    cursor: query.cursor,
    limit: 50,
    status: query.status || undefined,
    company: query.company || undefined,
    overdue: query.overdue === "1" ? "1" : undefined,
    q: query.q || undefined,
  };

  const [payload, conversationsPayload, contactsPayload] = await Promise.all([
    apiFetch<Task[] | Paginated<Task>>("/api/v1/tasks", { query: filters }),
    apiFetch<Conversation[] | Paginated<Conversation>>("/api/v1/conversations", { query: { limit: 200 } }),
    apiFetch<Contact[] | Paginated<Contact>>("/api/v1/contacts", { query: { limit: 200 } }),
  ]);
  const taskList = itemsFrom(payload);
  const conversations = itemsFrom(conversationsPayload);
  const contacts = itemsFrom(contactsPayload);

  const filterParams = new URLSearchParams();
  if (query.status) filterParams.set("status", query.status);
  if (query.company) filterParams.set("company", query.company);
  if (query.overdue === "1") filterParams.set("overdue", "1");
  if (query.q) filterParams.set("q", query.q);

  return (
    <div className="mx-auto max-w-5xl p-5 md:p-9 lg:p-12">
      <PageHeader
        eyebrow="Organização"
        title="Tarefas"
        description="Cadastre e acompanhe tarefas com prazo, empresa e vínculo opcional a conversas ou contatos. Também disponíveis via MCP."
      />
      {query.created === "1" && (
        <p className="mb-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <Check size={17} />Tarefa criada.
        </p>
      )}
      {query.deleted === "1" && (
        <p className="mb-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <Check size={17} />Tarefa apagada.
        </p>
      )}

      <TaskCreateForm conversations={conversations} contacts={contacts} />

      <div className="mb-6 grid gap-3 rounded-2xl border border-line bg-white p-4 sm:grid-cols-[1fr_1fr_auto_auto]">
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Busca</span>
          <LiveSearchInput
            name="q"
            defaultValue={query.q || ""}
            placeholder="Título ou descrição"
            className="focus-ring h-10 w-full rounded-xl border border-line bg-white pl-10 pr-3 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Empresa</span>
          <LiveSearchInput
            name="company"
            defaultValue={query.company || ""}
            placeholder="Filtrar empresa"
            className="focus-ring h-10 w-full rounded-xl border border-line bg-white pl-10 pr-3 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Status</span>
          <LiveSelect
            name="status"
            label="Status"
            value={query.status || ""}
            options={[
              ["", "Todos"],
              ["pending", "Pendente"],
              ["in_progress", "Em andamento"],
              ["blocked", "Bloqueada"],
              ["done", "Concluída"],
              ["cancelled", "Cancelada"],
            ]}
            className="focus-ring h-10 w-full rounded-xl border border-line bg-white px-3 text-sm"
          />
        </label>
        <div className="flex items-end pb-2">
          <LiveCheckbox name="overdue" label="Só atrasadas" checked={query.overdue === "1"} />
        </div>
      </div>

      {taskList.length ? (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          {taskList.map((task) => {
            const overdue = isOverdue(task);
            return (
              <Link
                key={task.id}
                href={`/tarefas/${encodeURIComponent(task.id)}`}
                className="flex flex-wrap items-center gap-4 border-b border-line p-4 last:border-0 hover:bg-slate-50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold">{task.title}</p>
                    <Badge tone={statusTone(task.status)}>{statusLabel[task.status] || task.status}</Badge>
                    {overdue && <Badge tone="danger">Atrasada</Badge>}
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {[task.company, task.conversation_title, task.contact_name].filter(Boolean).join(" · ") || "Sem vínculos"}
                  </p>
                </div>
                <div className="text-right text-xs text-muted">
                  <p>{task.due_at ? `Prazo ${formatDate(task.due_at, false)}` : "Sem prazo"}</p>
                  <p className="mt-1">Criada {formatDate(task.created_at, false)}</p>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState title="Nenhuma tarefa" description="Crie uma tarefa acima ou ajuste os filtros." />
      )}

      {!Array.isArray(payload) && payload.next_cursor && (
        <Link
          href={`?${new URLSearchParams({ ...Object.fromEntries(filterParams), cursor: payload.next_cursor }).toString()}`}
          className="focus-ring mt-5 inline-flex rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold"
        >
          Próxima página
        </Link>
      )}
    </div>
  );
}
