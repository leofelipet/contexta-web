import type { Metadata } from "next";
import { MessageCircle } from "lucide-react";
import { ConversationList } from "@/components/conversation-list";
import { apiFetch, itemsFrom } from "@/lib/api";
import type { Conversation, Paginated } from "@/lib/types";

export const metadata: Metadata = { title: "Conversas" };
export default async function ConversationsPage({ searchParams }: { searchParams: Promise<{ q?: string; contact_id?: string; cursor?: string }> }) {
  const filters = await searchParams;
  const payload = await apiFetch<Conversation[] | Paginated<Conversation>>("/api/v1/conversations", { query: { query: filters.q, contact_id: filters.contact_id, cursor: filters.cursor, limit: 100 } });
  const nextCursor = Array.isArray(payload) ? null : payload.next_cursor;
  return <div className="flex min-h-[calc(100vh-64px)] md:min-h-screen"><ConversationList conversations={itemsFrom(payload)} query={filters.q} contactId={filters.contact_id} nextCursor={nextCursor} /><section className="chat-grid hidden flex-1 items-center justify-center lg:flex"><div className="max-w-sm text-center"><span className="mx-auto grid size-16 place-items-center rounded-full bg-white text-brand shadow-sm"><MessageCircle size={29} /></span><h2 className="mt-5 text-xl font-semibold">Suas conversas, em contexto</h2><p className="mt-2 text-sm leading-6 text-muted">Selecione uma conversa ao lado para consultar o histórico completo.</p></div></section></div>;
}
