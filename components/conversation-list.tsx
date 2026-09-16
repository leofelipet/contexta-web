import Link from "next/link";
import { Search } from "lucide-react";
import { Avatar } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { messageDisplay } from "@/lib/message-display";
import type { Conversation } from "@/lib/types";

export function ConversationList({ conversations, selectedId, query, contactId, nextCursor }: { conversations: Conversation[]; selectedId?: string; query?: string; contactId?: string; nextCursor?: string | null }) {
  return <section className={`w-full shrink-0 border-r border-line bg-white lg:w-[360px] ${selectedId ? "hidden lg:block" : "block"}`}>
    <header className="border-b border-line p-4"><h1 className="text-xl font-semibold tracking-tight">Conversas</h1><form className="relative mt-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={17} /><input name="q" defaultValue={query} placeholder="Buscar conversa" className="focus-ring h-10 w-full rounded-xl bg-slate-100 pl-10 pr-3 text-sm" /></form></header>
    <div className="scrollbar overflow-y-auto lg:h-[calc(100vh-97px)]">{conversations.length ? conversations.map((conversation) => {
      const name = conversation.title || "Conversa sem título";
      const message = conversation.last_message;
      const preview = message ? messageDisplay(message).text : "Sem mensagens";
      const selected = selectedId === conversation.id;
      return <Link key={conversation.id} href={`/conversations/${encodeURIComponent(conversation.id)}`} className={`focus-ring flex gap-3 border-b border-line p-4 transition ${selected ? "bg-brand-soft" : "hover:bg-slate-50"}`}><Avatar name={name} /><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-semibold">{name}</p><time className="shrink-0 text-[11px] text-muted">{formatDate(conversation.last_message_at, false)}</time></div><div className="mt-1 flex items-center gap-2"><p className="min-w-0 flex-1 truncate text-xs text-muted">{preview}</p></div></div></Link>;
    }) : <div className="p-8 text-center text-sm text-muted">Nenhuma conversa encontrada.</div>}{nextCursor && <Link className="focus-ring m-4 block rounded-xl border border-line px-4 py-2.5 text-center text-xs font-semibold text-brand" href={`/conversations?${new URLSearchParams({ ...(query ? { q: query } : {}), ...(contactId ? { contact_id: contactId } : {}), cursor: nextCursor }).toString()}`}>Carregar conversas anteriores</Link>}</div>
  </section>;
}
