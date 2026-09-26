import type { Metadata } from "next";
import Link from "next/link";
import { Check, HardDrive } from "lucide-react";
import { DeleteConversationButton } from "@/components/delete-conversation-button";
import { Badge, EmptyState, PageHeader } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { StaleConversationsResponse } from "@/lib/types";

export const metadata: Metadata = { title: "Limpeza" };

export default async function LimpezaPage({ searchParams }: { searchParams: Promise<{ days?: string; cursor?: string; deleted?: string }> }) {
  const query = await searchParams;
  const days = Number(query.days) > 0 ? Number(query.days) : 30;
  const payload = await apiFetch<StaleConversationsResponse>("/api/v1/conversations/stale", {
    query: { days, cursor: query.cursor, limit: 50 },
  });
  const conversations = payload.data || [];
  const totalMessages = conversations.reduce((sum, item) => sum + (item.message_count || 0), 0);

  return <div className="mx-auto max-w-5xl p-5 md:p-9 lg:p-12">
    <PageHeader
      eyebrow="Armazenamento"
      title="Limpeza"
      description="Conversas sem atividade recente para liberar espaço no banco. O padrão é 30 dias sem mensagens."
      action={<Badge tone={conversations.length ? "warning" : "success"}>{conversations.length ? `${conversations.length} candidatas` : "Nada pendente"}</Badge>}
    />

    {query.deleted === "1" && <p className="mb-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"><Check size={17} />Conversa apagada com sucesso.</p>}

    <section className="mb-6 rounded-2xl border border-line bg-white p-6">
      <div className="flex items-center gap-2"><HardDrive size={18} className="text-brand" /><h2 className="font-semibold">Filtro de inatividade</h2></div>
      <p className="mt-2 text-sm text-muted">Lista conversas cuja última mensagem (ou criação, se vazia) é mais antiga que o período escolhido.</p>
      <form className="mt-5 flex flex-wrap items-end gap-3">
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Dias sem mensagem</span>
          <input type="number" name="days" min={1} max={3650} defaultValue={days} className="focus-ring w-32 rounded-xl border border-line px-3 py-2.5 text-sm" />
        </label>
        <button className="focus-ring rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">Atualizar lista</button>
      </form>
      {conversations.length > 0 && (
        <p className="mt-4 text-xs text-muted">
          Nesta página: {conversations.length.toLocaleString("pt-BR")} conversas · {totalMessages.toLocaleString("pt-BR")} mensagens acumuladas
        </p>
      )}
    </section>

    {conversations.length ? <div className="overflow-hidden rounded-2xl border border-line bg-white">
      {conversations.map((conversation) => {
        const title = conversation.title || "Conversa sem título";
        const kind = conversation.type === "group" ? "Grupo" : conversation.type === "direct" ? "Direta" : conversation.type;
        return (
          <div key={conversation.id} className="flex flex-wrap items-center gap-4 border-b border-line p-4 last:border-0">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-semibold">{title}</p>
                <Badge tone="neutral">{kind}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted">
                {conversation.message_count.toLocaleString("pt-BR")} mensagens · inativa há {conversation.inactive_days} dias
                {conversation.last_message_at ? ` · última ${formatDate(conversation.last_message_at)}` : " · sem mensagens"}
              </p>
            </div>
            <Link href={`/conversations/${encodeURIComponent(conversation.id)}`} className="focus-ring rounded-lg px-3 py-2 text-xs font-semibold text-brand hover:bg-brand-soft">
              Abrir
            </Link>
            <DeleteConversationButton
              conversationId={conversation.id}
              conversationTitle={title}
              messageCount={conversation.message_count}
            />
          </div>
        );
      })}
    </div> : <EmptyState title="Nenhuma conversa inativa" description={`Não há conversas com mais de ${days} dias sem mensagens.`} />}

    {payload.next_cursor && (
      <Link
        href={`?${new URLSearchParams({ days: String(days), cursor: payload.next_cursor }).toString()}`}
        className="focus-ring mt-5 inline-flex rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold"
      >
        Próxima página
      </Link>
    )}
  </div>;
}
