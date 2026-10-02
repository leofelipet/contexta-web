import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Check, Repeat, X } from "lucide-react";
import { bulkDeleteTasks, bulkSetTasksStatus } from "@/app/actions";
import { type BulkAction, BulkActionBar, BulkCheckbox, BulkSelectAll, BulkSelectionProvider } from "@/components/bulk-selection";
import { TaskCompleteButton } from "@/components/task-complete-button";
import { TaskCreateForm } from "@/components/task-create-form";
import { LiveCheckbox, LiveSearchInput, LiveSelect } from "@/components/live-filters";
import { SectionTabs } from "@/components/section-tabs";
import { tarefasTabs } from "@/components/section-tab-items";
import { Badge, EmptyState, PageHeader } from "@/components/ui";
import { apiFetch, itemsFrom } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Company, Contact, Conversation, Paginated, Task } from "@/lib/types";

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

const taskNoun = ["tarefa", "tarefas"] as const;

function isClosed(task: Task) {
  return task.status === "done" || task.status === "cancelled";
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
    closed?: string;
    q?: string;
    schedule?: string;
  }>;
}) {
  const query = await searchParams;
  const showClosed = query.closed === "1";
  const filters = {
    cursor: query.cursor,
    limit: 50,
    status: query.status || undefined,
    company_id: query.company || undefined,
    overdue: query.overdue === "1" ? "1" : undefined,
    open_only: showClosed || query.status ? undefined : "1",
    q: query.q || undefined,
    schedule_id: query.schedule || undefined,
  };

  const [payload, conversationsPayload, contactsPayload, companiesPayload] = await Promise.all([
    apiFetch<Task[] | Paginated<Task>>("/api/v1/tasks", { query: filters }),
    apiFetch<Conversation[] | Paginated<Conversation>>("/api/v1/conversations", { query: { limit: 200 } }),
    apiFetch<Contact[] | Paginated<Contact>>("/api/v1/contacts", { query: { limit: 200 } }),
    apiFetch<Company[] | Paginated<Company>>("/api/v1/companies", { query: { limit: 200 } }),
  ]);
  const taskList = itemsFrom(payload);
  const conversations = itemsFrom(conversationsPayload);
  const contacts = itemsFrom(contactsPayload);
  const companies = itemsFrom(companiesPayload);
  const filteredCompany = query.company ? companies.find((company) => company.id === query.company) : undefined;

  const filterParams = new URLSearchParams();
  if (query.status) filterParams.set("status", query.status);
  if (query.company) filterParams.set("company", query.company);
  if (query.overdue === "1") filterParams.set("overdue", "1");
  if (showClosed) filterParams.set("closed", "1");
  if (query.q) filterParams.set("q", query.q);
  if (query.schedule) filterParams.set("schedule", query.schedule);

  const bulkActions: BulkAction[] = [
    { label: "Concluir", icon: "check", run: bulkSetTasksStatus.bind(null, "done"), done: ["tarefa concluída", "tarefas concluídas"] },
    { label: "Cancelar", icon: "cancel", run: bulkSetTasksStatus.bind(null, "cancelled"), done: ["tarefa cancelada", "tarefas canceladas"] },
    ...(showClosed || query.status === "done" || query.status === "cancelled"
      ? [{ label: "Reabrir", icon: "play", run: bulkSetTasksStatus.bind(null, "pending"), done: ["tarefa reaberta", "tarefas reabertas"] } satisfies BulkAction]
      : []),
    {
      label: "Apagar",
      icon: "trash",
      tone: "danger",
      run: bulkDeleteTasks,
      done: ["tarefa apagada", "tarefas apagadas"],
      confirm: {
        title: "Apagar {n}?",
        description: "Essa ação apaga {n} de forma permanente e não pode ser desfeita. As memórias vinculadas são mantidas.",
        confirmLabel: "Apagar",
      },
    },
  ];

  return (
    <div className="mx-auto max-w-5xl p-5 md:p-9 lg:p-12">
      <PageHeader
        eyebrow="Organização"
        title="Tarefas"
        description="Cadastre e acompanhe tarefas com prazo, empresa e vínculo opcional a conversas ou contatos. Também disponíveis via MCP."
      />
      <SectionTabs items={tarefasTabs} />
      {query.schedule && (
        <p className="mb-5 flex flex-wrap items-center gap-2 rounded-xl bg-brand-soft px-4 py-3 text-sm font-medium text-brand">
          <Repeat size={17} />Mostrando tarefas criadas pela recorrência #{query.schedule}.
          <Link
            href={`?${(() => { const params = new URLSearchParams(filterParams); params.delete("schedule"); return params.toString(); })()}`}
            className="focus-ring ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-white/60"
          >
            <X size={15} />Limpar
          </Link>
        </p>
      )}
      {filteredCompany && (
        <p className="mb-5 flex flex-wrap items-center gap-2 rounded-xl bg-brand-soft px-4 py-3 text-sm font-medium text-brand">
          <Building2 size={17} />Mostrando tarefas da empresa
          <Link href={`/empresas/${encodeURIComponent(filteredCompany.id)}`} className="underline">{filteredCompany.name}</Link>.
        </p>
      )}
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

      <TaskCreateForm conversations={conversations} contacts={contacts} companies={companies} defaultCompanyId={query.company} />

      <div className="mb-6 grid gap-3 rounded-2xl border border-line bg-white p-4 sm:grid-cols-[1fr_1fr_auto] lg:grid-cols-[1fr_1fr_auto_auto_auto]">
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Busca</span>
          <LiveSearchInput
            name="q"
            defaultValue={query.q || ""}
            placeholder="Título, descrição ou #ID"
            className="focus-ring h-10 w-full rounded-xl border border-line bg-white pl-10 pr-3 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Empresa</span>
          <LiveSelect
            name="company"
            label="Empresa"
            value={query.company || ""}
            options={[["", "Todas"], ...companies.map((company): [string, string] => [company.id, company.name])]}
            className="focus-ring h-10 w-full rounded-xl border border-line bg-white px-3 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Status</span>
          <LiveSelect
            name="status"
            label="Status"
            value={query.status || ""}
            options={[
              ["", "Abertas"],
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
        <div className="flex items-end pb-2">
          <LiveCheckbox name="closed" label="Mostrar encerradas" checked={showClosed} />
        </div>
      </div>

      {taskList.length ? (
        <BulkSelectionProvider ids={taskList.map((task) => task.id)}>
          <div className="overflow-hidden rounded-2xl border border-line bg-white">
            <BulkSelectAll noun={taskNoun} />
            {taskList.map((task) => {
              const overdue = isOverdue(task);
              const label = `#${task.id} - ${task.title}`;
              return (
                <div
                  key={task.id}
                  className="flex items-center gap-3 border-b border-line pl-4 pr-3 transition last:border-0 hover:bg-slate-50 has-[[data-bulk]:checked]:bg-brand-soft/60 has-[[data-completing]]:opacity-40"
                >
                  <BulkCheckbox id={task.id} label={label} />
                  <Link
                    href={`/tarefas/${encodeURIComponent(task.id)}`}
                    className="focus-ring flex min-w-0 flex-1 flex-wrap items-center gap-4 rounded-lg py-4"
                  >
                    <div className="min-w-40 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold">{label}</p>
                        <Badge tone={statusTone(task.status)}>{statusLabel[task.status] || task.status}</Badge>
                        {overdue && <Badge tone="danger">Atrasada</Badge>}
                        {task.schedule_id && <Badge tone="neutral">Recorrente</Badge>}
                      </div>
                      <p className="mt-1 text-xs text-muted">
                        {[task.company_name, task.conversation_title, task.contact_name].filter(Boolean).join(" · ") || "Sem vínculos"}
                      </p>
                    </div>
                    <div className="text-xs text-muted sm:text-right">
                      <p>{task.due_at ? `Prazo ${formatDate(task.due_at, false)}` : "Sem prazo"}</p>
                      <p className="mt-1">Criada {formatDate(task.created_at, false)}</p>
                    </div>
                  </Link>
                  {isClosed(task) ? <span aria-hidden className="size-8 shrink-0" /> : <TaskCompleteButton id={task.id} title={task.title} />}
                </div>
              );
            })}
          </div>
          <BulkActionBar noun={taskNoun} actions={bulkActions} />
        </BulkSelectionProvider>
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
