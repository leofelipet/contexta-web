import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { bulkDeleteMemories } from "@/app/actions";
import { type BulkAction, BulkActionBar, BulkCheckbox, BulkList, BulkSelectAll, BulkSelectionProvider } from "@/components/bulk-selection";
import { MemoryCreateForm } from "@/components/memory-create-form";
import { LiveSearchInput, LiveSelect } from "@/components/live-filters";
import { Badge, EmptyState, PageHeader } from "@/components/ui";
import { apiFetch, itemsFrom } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Contact, Conversation, Memory, MemorySearchResult, Paginated } from "@/lib/types";

export const metadata: Metadata = { title: "Memórias" };

const memoryNoun = ["memória", "memórias"] as const;

const bulkActions: BulkAction[] = [
  {
    label: "Apagar",
    icon: "trash",
    tone: "danger",
    run: bulkDeleteMemories,
    done: ["memória apagada", "memórias apagadas"],
    confirm: {
      title: "Apagar {n}?",
      description: "Essa ação apaga {n} de forma permanente, junto com os vínculos com tarefas, e não pode ser desfeita.",
      confirmLabel: "Apagar",
    },
  },
];

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

export default async function MemoriasPage({
  searchParams,
}: {
  searchParams: Promise<{
    created?: string;
    deleted?: string;
    cursor?: string;
    source?: string;
    conversation_id?: string;
    contact_id?: string;
    q?: string;
    search?: string;
  }>;
}) {
  const query = await searchParams;
  const filters = {
    cursor: query.cursor,
    limit: 50,
    source: query.source || undefined,
    conversation_id: query.conversation_id || undefined,
    contact_id: query.contact_id || undefined,
    q: query.q || undefined,
  };

  const semanticQuery = (query.search || "").trim();

  const [payload, conversationsPayload, contactsPayload, searchResult] = await Promise.all([
    apiFetch<Memory[] | Paginated<Memory>>("/api/v1/memories", { query: filters }),
    apiFetch<Conversation[] | Paginated<Conversation>>("/api/v1/conversations", { query: { limit: 200 } }),
    apiFetch<Contact[] | Paginated<Contact>>("/api/v1/contacts", { query: { limit: 200 } }),
    semanticQuery
      ? apiFetch<MemorySearchResult>("/api/v1/memories/search", {
          method: "POST",
          body: {
            query: semanticQuery,
            conversation_id: query.conversation_id || undefined,
            contact_id: query.contact_id || undefined,
            limit: 20,
          },
        }).catch(() => null)
      : Promise.resolve(null),
  ]);

  const memoryList = itemsFrom(payload);
  const conversations = itemsFrom(conversationsPayload);
  const contacts = itemsFrom(contactsPayload);

  const filterParams = new URLSearchParams();
  if (query.source) filterParams.set("source", query.source);
  if (query.conversation_id) filterParams.set("conversation_id", query.conversation_id);
  if (query.contact_id) filterParams.set("contact_id", query.contact_id);
  if (query.q) filterParams.set("q", query.q);
  if (semanticQuery) filterParams.set("search", semanticQuery);

  return (
    <div className="mx-auto max-w-5xl p-5 md:p-9 lg:p-12">
      <PageHeader
        eyebrow="Contexto"
        title="Memórias"
        description="Notas e mensagens salvas para recall semântico do agente (MCP) e da equipe. Só entra o que alguém grava de propósito."
      />
      {query.created === "1" && (
        <p className="mb-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <Check size={17} />Memória criada.
        </p>
      )}
      {query.deleted === "1" && (
        <p className="mb-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <Check size={17} />Memória apagada.
        </p>
      )}

      <MemoryCreateForm conversations={conversations} contacts={contacts} />

      <form className="mb-6 rounded-2xl border border-line bg-white p-4" method="get">
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Busca semântica</span>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              name="search"
              defaultValue={semanticQuery}
              placeholder="Ex.: preferência de horário do cliente"
              className="focus-ring h-10 w-full flex-1 rounded-xl border border-line bg-white px-3 text-sm"
            />
            {query.source ? <input type="hidden" name="source" value={query.source} /> : null}
            {query.conversation_id ? <input type="hidden" name="conversation_id" value={query.conversation_id} /> : null}
            {query.contact_id ? <input type="hidden" name="contact_id" value={query.contact_id} /> : null}
            {query.q ? <input type="hidden" name="q" value={query.q} /> : null}
            <button className="focus-ring h-10 shrink-0 rounded-xl bg-ink px-4 text-sm font-semibold text-white hover:bg-brand-dark">
              Buscar por similaridade
            </button>
          </div>
        </label>
      </form>

      {searchResult ? (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            Resultados semânticos{semanticQuery ? ` · “${semanticQuery}”` : ""}
          </h2>
          {searchResult.hits.length ? (
            <div className="overflow-hidden rounded-2xl border border-line bg-white">
              {searchResult.hits.map((hit) => (
                <Link
                  key={hit.memory.id}
                  href={`/memorias/${encodeURIComponent(hit.memory.id)}`}
                  className="flex flex-wrap items-start gap-4 border-b border-line p-4 last:border-0 hover:bg-slate-50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold">{hit.memory.title || "Sem título"}</p>
                      <Badge tone="neutral">{sourceLabel[hit.memory.source] || hit.memory.source}</Badge>
                      <Badge tone="success">{Math.round(hit.score * 100)}%</Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted">{hit.memory.content}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="Nenhum hit" description="Nenhuma memória indexada parecida com essa consulta." />
          )}
        </section>
      ) : null}

      <div className="mb-6 grid gap-3 rounded-2xl border border-line bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Busca textual</span>
          <LiveSearchInput
            name="q"
            defaultValue={query.q || ""}
            placeholder="Título ou conteúdo"
            className="focus-ring h-10 w-full rounded-xl border border-line bg-white pl-10 pr-3 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Origem</span>
          <LiveSelect
            name="source"
            label="Origem"
            value={query.source || ""}
            options={[
              ["", "Todas"],
              ["note", "Nota"],
              ["message", "Mensagem"],
            ]}
            className="focus-ring h-10 w-full rounded-xl border border-line bg-white px-3 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Conversa</span>
          <LiveSelect
            name="conversation_id"
            label="Conversa"
            value={query.conversation_id || ""}
            options={[
              ["", "Todas"],
              ...conversations.map((item) => [item.id, item.title || "Sem título"] as [string, string]),
            ]}
            className="focus-ring h-10 w-full rounded-xl border border-line bg-white px-3 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Contato</span>
          <LiveSelect
            name="contact_id"
            label="Contato"
            value={query.contact_id || ""}
            options={[
              ["", "Todos"],
              ...contacts.map((item) => [item.id, item.name || item.push_name || item.phone || item.id] as [string, string]),
            ]}
            className="focus-ring h-10 w-full rounded-xl border border-line bg-white px-3 text-sm"
          />
        </label>
      </div>

      {memoryList.length ? (
        <BulkSelectionProvider ids={memoryList.map((memory) => memory.id)}>
          <BulkList className="overflow-hidden rounded-2xl border border-line bg-white">
            <BulkSelectAll noun={memoryNoun} />
            {memoryList.map((memory) => (
              <div key={memory.id} data-bulk-row={memory.id} className="flex items-center gap-3 border-b border-line pl-4 pr-3 transition last:border-0 hover:bg-slate-50 has-[[data-bulk]:checked]:bg-brand-soft/60">
                <BulkCheckbox id={memory.id} label={memory.title || "Sem título"} />
                <Link
                  href={`/memorias/${encodeURIComponent(memory.id)}`}
                  className="focus-ring flex min-w-0 flex-1 flex-wrap items-center gap-4 rounded-lg py-4 pr-1"
                >
                  <div className="min-w-40 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold">{memory.title || "Sem título"}</p>
                      <Badge tone="neutral">{sourceLabel[memory.source] || memory.source}</Badge>
                      <Badge tone={embeddingTone(memory.embedding_status)}>{embeddingLabel(memory.embedding_status)}</Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted">{memory.content}</p>
                    <p className="mt-1 text-xs text-muted">
                      {[memory.conversation_title, memory.contact_name].filter(Boolean).join(" · ") || "Sem vínculos"}
                    </p>
                  </div>
                  <div className="text-xs text-muted sm:text-right">
                    <p>Criada {formatDate(memory.created_at, false)}</p>
                  </div>
                </Link>
              </div>
            ))}
          </BulkList>
          <BulkActionBar noun={memoryNoun} actions={bulkActions} />
        </BulkSelectionProvider>
      ) : (
        <EmptyState title="Nenhuma memória" description="Crie uma memória acima ou ajuste os filtros." />
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
