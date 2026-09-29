import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Check, Pause, Play } from "lucide-react";
import { notFound } from "next/navigation";
import { setTaskScheduleEnabled } from "@/app/actions";
import { TaskScheduleForm } from "@/components/task-schedule-form";
import { Badge, EmptyState, PageHeader } from "@/components/ui";
import { apiFetch, itemsFrom } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { describeCron } from "@/lib/schedule-form";
import type { Contact, Conversation, Paginated, Task, TaskSchedule } from "@/lib/types";

export const metadata: Metadata = { title: "Tarefa recorrente" };

const statusLabel: Record<string, string> = {
  pending: "Pendente",
  in_progress: "Em andamento",
  blocked: "Bloqueada",
  done: "Concluída",
  cancelled: "Cancelada",
};

export default async function RecorrenteDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; updated?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;

  let schedule: TaskSchedule;
  try {
    schedule = await apiFetch<TaskSchedule>(`/api/v1/task-schedules/${encodeURIComponent(id)}`);
  } catch {
    notFound();
  }

  const [conversationsPayload, contactsPayload, tasksPayload] = await Promise.all([
    apiFetch<Conversation[] | Paginated<Conversation>>("/api/v1/conversations", { query: { limit: 200 } }),
    apiFetch<Contact[] | Paginated<Contact>>("/api/v1/contacts", { query: { limit: 200 } }),
    apiFetch<Task[] | Paginated<Task>>("/api/v1/tasks", { query: { schedule_id: schedule.id, limit: 20 } }),
  ]);
  const createdTasks = itemsFrom(tasksPayload);

  return (
    <div className="mx-auto max-w-3xl p-5 md:p-9 lg:p-12">
      <Link href="/recorrentes" className="focus-ring mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft size={16} />Voltar às recorrências
      </Link>
      <PageHeader
        eyebrow="Tarefa recorrente"
        title={`#${schedule.id} - ${schedule.title}`}
        description={`${describeCron(schedule.cron)} (${schedule.timezone}) · criada em ${formatDate(schedule.created_at)}`}
        action={<Badge tone={schedule.enabled ? "success" : "neutral"}>{schedule.enabled ? "Ativa" : "Pausada"}</Badge>}
      />
      {query.created === "1" && (
        <p className="mb-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <Check size={17} />Recorrência criada.
        </p>
      )}
      {query.updated === "1" && (
        <p className="mb-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <Check size={17} />Recorrência atualizada.
        </p>
      )}

      <section className="mb-6 grid gap-4 rounded-2xl border border-line bg-white p-6 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-center">
        <Stat label="Próxima execução" value={schedule.enabled && schedule.next_run_at ? formatDate(schedule.next_run_at) : "Pausada"} />
        <Stat label="Última execução" value={schedule.last_run_at ? formatDate(schedule.last_run_at) : "Nunca"} />
        <Stat label="Tarefas criadas" value={String(schedule.run_count)} />
        <form action={setTaskScheduleEnabled}>
          <input type="hidden" name="id" value={schedule.id} />
          <input type="hidden" name="enabled" value={schedule.enabled ? "false" : "true"} />
          <button className="focus-ring inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold hover:bg-slate-50">
            {schedule.enabled ? <><Pause size={16} />Pausar</> : <><Play size={16} />Retomar</>}
          </button>
        </form>
      </section>

      <section className="mb-6 rounded-2xl border border-line bg-white p-6">
        <h2 className="mb-5 font-semibold">Configuração</h2>
        <TaskScheduleForm
          schedule={schedule}
          conversations={itemsFrom(conversationsPayload)}
          contacts={itemsFrom(contactsPayload)}
        />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-semibold">Tarefas criadas</h2>
          {createdTasks.length ? (
            <Link href={`/tarefas?schedule=${encodeURIComponent(schedule.id)}&closed=1`} className="text-sm font-medium text-muted hover:text-ink">
              Ver todas as tarefas
            </Link>
          ) : null}
        </div>
        {createdTasks.length ? (
          <div className="overflow-hidden rounded-2xl border border-line bg-white">
            {createdTasks.map((task) => (
              <Link
                key={task.id}
                href={`/tarefas/${encodeURIComponent(task.id)}`}
                className="flex flex-wrap items-center gap-3 border-b border-line p-4 last:border-0 hover:bg-slate-50"
              >
                <p className="min-w-0 flex-1 truncate text-sm font-semibold">#{task.id} - {task.title}</p>
                <Badge tone={task.status === "done" ? "success" : "neutral"}>{statusLabel[task.status] || task.status}</Badge>
                <p className="text-xs text-muted">Criada {formatDate(task.created_at)}</p>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title="Nenhuma tarefa ainda" description="As tarefas aparecem aqui conforme a recorrência for executada." />
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}
