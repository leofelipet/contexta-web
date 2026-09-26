import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { notFound } from "next/navigation";
import { MemoryEditForm } from "@/components/memory-edit-form";
import { Badge, PageHeader } from "@/components/ui";
import { apiFetch, itemsFrom } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Contact, Conversation, Memory, Paginated } from "@/lib/types";

export const metadata: Metadata = { title: "Memória" };

const sourceLabel: Record<string, string> = {
  note: "Nota",
  message: "Mensagem",
};

function embeddingTone(status: string): "success" | "danger" | "warning" | "neutral" {
  if (status === "ready") return "success";
  if (status === "failed") return "danger";
  if (status === "pending") return "warning";
  return "neutral";
}

function embeddingLabel(status: string) {
  if (status === "ready") return "Indexada";
  if (status === "failed") return "Falha no embedding";
  if (status === "pending") return "Pendente";
  return status;
}

export default async function MemoriaDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ updated?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;

  let memory: Memory;
  try {
    memory = await apiFetch<Memory>(`/api/v1/memories/${encodeURIComponent(id)}`);
  } catch {
    notFound();
  }

  const [conversationsPayload, contactsPayload] = await Promise.all([
    apiFetch<Conversation[] | Paginated<Conversation>>("/api/v1/conversations", { query: { limit: 200 } }),
    apiFetch<Contact[] | Paginated<Contact>>("/api/v1/contacts", { query: { limit: 200 } }),
  ]);

  return (
    <div className="mx-auto max-w-3xl p-5 md:p-9 lg:p-12">
      <Link href="/memorias" className="focus-ring mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft size={16} />Voltar às memórias
      </Link>
      <PageHeader
        eyebrow="Memória"
        title={memory.title || "Sem título"}
        description={`Criada em ${formatDate(memory.created_at)} · atualizada em ${formatDate(memory.updated_at)}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Badge tone="neutral">{sourceLabel[memory.source] || memory.source}</Badge>
            <Badge tone={embeddingTone(memory.embedding_status)}>{embeddingLabel(memory.embedding_status)}</Badge>
          </div>
        }
      />
      {query.updated === "1" && (
        <p className="mb-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <Check size={17} />Memória atualizada.
        </p>
      )}
      {memory.embedding_status === "failed" && memory.embedding_error ? (
        <p className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{memory.embedding_error}</p>
      ) : null}
      <div className="rounded-2xl border border-line bg-white p-6">
        <MemoryEditForm
          memory={memory}
          conversations={itemsFrom(conversationsPayload)}
          contacts={itemsFrom(contactsPayload)}
        />
      </div>
    </div>
  );
}
