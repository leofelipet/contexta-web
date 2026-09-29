import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Check, Repeat } from "lucide-react";
import { notFound } from "next/navigation";
import { TaskEditForm } from "@/components/task-edit-form";
import { TaskMemoriesSection } from "@/components/task-memories-section";
import { Badge, PageHeader } from "@/components/ui";
import { apiFetch, itemsFrom } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Contact, Conversation, Memory, Paginated, Task } from "@/lib/types";

export const metadata: Metadata = { title: "Tarefa" };

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

export default async function TarefaDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ updated?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;

  let task: Task;
  try {
    task = await apiFetch<Task>(`/api/v1/tasks/${encodeURIComponent(id)}`);
  } catch {
    notFound();
  }

  const [conversationsPayload, contactsPayload, memoriesPayload] = await Promise.all([
    apiFetch<Conversation[] | Paginated<Conversation>>("/api/v1/conversations", { query: { limit: 200 } }),
    apiFetch<Contact[] | Paginated<Contact>>("/api/v1/contacts", { query: { limit: 200 } }),
    apiFetch<Memory[] | Paginated<Memory>>("/api/v1/memories", { query: { limit: 200 } }),
  ]);

  return (
    <div className="mx-auto max-w-3xl p-5 md:p-9 lg:p-12">
      <Link href="/tarefas" className="focus-ring mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft size={16} />Voltar às tarefas
      </Link>
      <PageHeader
        eyebrow="Tarefa"
        title={`#${task.id} - ${task.title}`}
        description={`Criada em ${formatDate(task.created_at)} · atualizada em ${formatDate(task.updated_at)}`}
        action={<Badge tone={statusTone(task.status)}>{statusLabel[task.status] || task.status}</Badge>}
      />
      {query.updated === "1" && (
        <p className="mb-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <Check size={17} />Tarefa atualizada.
        </p>
      )}
      {task.schedule_id && (
        <Link
          href={`/recorrentes/${encodeURIComponent(task.schedule_id)}`}
          className="focus-ring mb-5 flex items-center gap-2 rounded-xl bg-brand-soft px-4 py-3 text-sm font-medium text-brand hover:underline"
        >
          <Repeat size={17} />Criada automaticamente pela recorrência #{task.schedule_id}
        </Link>
      )}
      <div className="rounded-2xl border border-line bg-white p-6">
        <TaskEditForm
          task={task}
          conversations={itemsFrom(conversationsPayload)}
          contacts={itemsFrom(contactsPayload)}
        />
      </div>
      <TaskMemoriesSection
        taskId={task.id}
        linked={task.memories || []}
        candidates={itemsFrom(memoriesPayload)}
      />
    </div>
  );
}
