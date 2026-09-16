import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { FilterBar, SelectFilter } from "@/components/filter-bar";
import { EmptyState, PageHeader } from "@/components/ui";
import { apiFetch, itemsFrom } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { messageDisplay } from "@/lib/message-display";
import type { Message, Paginated } from "@/lib/types";

export const metadata: Metadata = { title: "Busca" };
export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; direction?: string; type?: string; cursor?: string }> }) {
  const filters = await searchParams;
  const payload = await apiFetch<Message[] | Paginated<Message>>("/api/v1/messages", { query: { query: filters.q, direction: filters.direction, type: filters.type, cursor: filters.cursor, limit: 100 } });
  const messages = itemsFrom(payload);
  return <div className="mx-auto max-w-5xl p-5 md:p-9 lg:p-12"><PageHeader eyebrow="Arquivo" title="Buscar mensagens" description="Encontre conteúdo no histórico sem navegar conversa por conversa." /><FilterBar defaultValue={filters.q} placeholder="Texto da mensagem"><SelectFilter name="direction" label="Direção" value={filters.direction} options={[["", "Todas as direções"], ["inbound", "Recebidas"], ["outbound", "Enviadas"]]} /><SelectFilter name="type" label="Tipo" value={filters.type} options={[["", "Todos os tipos"], ["text", "Texto"], ["image", "Imagem"], ["audio", "Áudio"], ["document", "Documento"]]} /></FilterBar>
    {messages.length ? <div className="space-y-3">{messages.map((message) => { const inbound = message.direction !== "outbound"; const display = messageDisplay(message); return <Link href={`/conversations/${encodeURIComponent(message.conversation_id || "")}`} key={message.id} className="focus-ring flex gap-3 rounded-2xl border border-line bg-white p-4 hover:border-emerald-200"><span className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-full ${inbound ? "bg-slate-100 text-slate-600" : "bg-brand-soft text-brand"}`}>{inbound ? <ArrowDownLeft size={17} /> : <ArrowUpRight size={17} />}</span><div className="min-w-0 flex-1"><p className="line-clamp-2 text-sm leading-6">{display.text}</p><p className="mt-2 text-xs text-muted">{display.isAudio && "Áudio · "}{inbound ? "Recebida" : "Enviada"} · {formatDate(message.timestamp)}</p></div></Link>; })}</div> : <EmptyState title="Nenhuma mensagem encontrada" description="Tente outro termo ou remova alguns filtros." />}
    {!Array.isArray(payload) && payload.next_cursor && <Link href={`?${new URLSearchParams({ ...(filters.q ? { q: filters.q } : {}), ...(filters.direction ? { direction: filters.direction } : {}), ...(filters.type ? { type: filters.type } : {}), cursor: payload.next_cursor }).toString()}`} className="focus-ring mt-5 inline-flex rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold">Próxima página</Link>}
  </div>;
}
