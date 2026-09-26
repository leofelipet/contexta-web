import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import { ConversationList } from "@/components/conversation-list";
import { MessageThread } from "@/components/message-thread";
import { Avatar } from "@/components/ui";
import { apiFetch, itemsFrom } from "@/lib/api";
import type { Conversation, Message, Paginated } from "@/lib/types";

export const metadata: Metadata = { title: "Conversa" };
export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const encodedId = encodeURIComponent(id);
  const [listPayload, conversation, messagePayload] = await Promise.all([
    apiFetch<Conversation[] | Paginated<Conversation>>("/api/v1/conversations", { query: { limit: 100 } }),
    apiFetch<Conversation>(`/api/v1/conversations/${encodedId}`),
    apiFetch<Message[] | Paginated<Message>>(`/api/v1/conversations/${encodedId}/messages`, { query: { limit: 50 } }),
  ]);
  const name = conversation.title || "Conversa sem título";
  const messages = [...itemsFrom(messagePayload)].reverse();
  const cursor = Array.isArray(messagePayload) ? null : messagePayload.next_cursor;
  return <div className="flex h-[calc(100vh-64px)] overflow-hidden md:h-screen"><ConversationList conversations={itemsFrom(listPayload)} selectedId={id} nextCursor={Array.isArray(listPayload) ? null : listPayload.next_cursor} /><section className="flex min-w-0 flex-1 flex-col bg-chat"><header className="flex h-[70px] shrink-0 items-center gap-3 border-b border-line bg-white px-4"><Link href="/conversations" aria-label="Voltar" className="focus-ring rounded-lg p-2 text-muted lg:hidden"><ArrowLeft size={20} /></Link><Avatar name={name} size="sm" /><div className="min-w-0 flex-1"><h1 className="truncate text-sm font-semibold">{name}</h1><p className="truncate text-xs text-muted">{conversation.type === "group" ? "Grupo" : "Histórico da conversa"}</p></div>{conversation.contact_id && <Link href={`/contacts/${encodeURIComponent(conversation.contact_id)}`} aria-label="Ver contato" className="focus-ring rounded-lg p-2 text-muted hover:bg-slate-100"><Info size={20} /></Link>}</header><MessageThread conversationId={id} initialMessages={messages} initialCursor={cursor} isGroup={conversation.type === "group"} /></section></div>;
}
