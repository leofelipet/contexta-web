"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Ban, Search } from "lucide-react";
import { Avatar } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { messageDisplay } from "@/lib/message-display";
import type { Conversation } from "@/lib/types";

const SCROLL_KEY = "contexta:conversations-list-scroll";

export function ConversationList({
  conversations,
  selectedId,
  query,
  contactId,
  nextCursor,
  blockedConversationIds = [],
  blockedContactIds = [],
}: {
  conversations: Conversation[];
  selectedId?: string;
  query?: string;
  contactId?: string;
  nextCursor?: string | null;
  blockedConversationIds?: string[];
  blockedContactIds?: string[];
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const blockedConversations = new Set(blockedConversationIds);
  const blockedContacts = new Set(blockedContactIds);

  useEffect(() => {
    const viewport = listRef.current;
    if (!viewport) return;
    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (saved != null) {
      const top = Number(saved);
      if (!Number.isNaN(top)) viewport.scrollTop = top;
    }
    function persist() {
      if (listRef.current) sessionStorage.setItem(SCROLL_KEY, String(listRef.current.scrollTop));
    }
    viewport.addEventListener("scroll", persist, { passive: true });
    return () => viewport.removeEventListener("scroll", persist);
  }, [selectedId]);

  return <section className={`w-full shrink-0 border-r border-line bg-white lg:w-[360px] ${selectedId ? "hidden lg:block" : "block"}`}>
    <header className="border-b border-line p-4"><h1 className="text-xl font-semibold tracking-tight">Conversas</h1><form className="relative mt-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={17} /><input name="q" defaultValue={query} placeholder="Buscar conversa" className="focus-ring h-10 w-full rounded-xl bg-slate-100 pl-10 pr-3 text-sm" /></form></header>
    <div ref={listRef} className="scrollbar overflow-y-auto lg:h-[calc(100vh-97px)]">{conversations.length ? conversations.map((conversation) => {
      const name = conversation.title || "Conversa sem título";
      const message = conversation.last_message;
      const preview = message ? messageDisplay(message).text : "Sem mensagens";
      const selected = selectedId === conversation.id;
      const blocked = blockedConversations.has(conversation.id)
        || Boolean(conversation.contact_id && blockedContacts.has(conversation.contact_id));
      return <Link
        key={conversation.id}
        href={`/conversations/${encodeURIComponent(conversation.id)}`}
        scroll={false}
        onClick={() => {
          if (listRef.current) sessionStorage.setItem(SCROLL_KEY, String(listRef.current.scrollTop));
        }}
        className={`focus-ring flex gap-3 border-b border-line p-4 transition ${selected ? "bg-brand-soft" : "hover:bg-slate-50"}`}
      >
        <Avatar name={name} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold">{name}</p>
            <time className="shrink-0 text-[11px] text-muted">{formatDate(conversation.last_message_at, false)}</time>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <p className="min-w-0 flex-1 truncate text-xs text-muted">{preview}</p>
            {blocked && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 ring-1 ring-inset ring-amber-200">
                <Ban size={10} />Bloqueada
              </span>
            )}
          </div>
        </div>
      </Link>;
    }) : <div className="p-8 text-center text-sm text-muted">Nenhuma conversa encontrada.</div>}{nextCursor && <Link className="focus-ring m-4 block rounded-xl border border-line px-4 py-2.5 text-center text-xs font-semibold text-brand" href={`/conversations?${new URLSearchParams({ ...(query ? { q: query } : {}), ...(contactId ? { contact_id: contactId } : {}), cursor: nextCursor }).toString()}`}>Carregar conversas anteriores</Link>}</div>
  </section>;
}
