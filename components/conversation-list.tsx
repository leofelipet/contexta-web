"use client";

import { Suspense, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Ban, ListChecks, Search, X } from "lucide-react";
import { bulkDeleteConversations } from "@/app/actions";
import { type BulkAction, BulkActionBar, BulkCheckbox, BulkList, BulkSelectAll, BulkSelectionProvider, useBulkSelection } from "@/components/bulk-selection";
import { Avatar } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { messageDisplay } from "@/lib/message-display";
import type { Conversation } from "@/lib/types";

const SCROLL_KEY = "contexta:conversations-list-scroll";

const conversationNoun = ["conversa", "conversas"] as const;

const bulkActions: BulkAction[] = [
  {
    label: "Apagar",
    icon: "trash",
    tone: "danger",
    run: bulkDeleteConversations,
    done: ["conversa apagada", "conversas apagadas"],
    confirm: {
      title: "Apagar {n}?",
      description: "Essa ação apaga {n} e todas as suas mensagens de forma permanente. Não pode ser desfeita.",
      confirmLabel: "Apagar",
    },
  },
];

type ConversationListProps = {
  conversations: Conversation[];
  selectedId?: string;
  query?: string;
  type?: string;
  contactId?: string;
  nextCursor?: string | null;
  blockedConversationIds?: string[];
  blockedContactIds?: string[];
};

export function ConversationList(props: ConversationListProps) {
  return (
    <Suspense fallback={<section className="w-full shrink-0 border-r border-line bg-white lg:w-[360px]"><div className="p-4 text-sm text-muted">Carregando conversas...</div></section>}>
      <ConversationListInner {...props} />
    </Suspense>
  );
}

function ConversationListInner({
  conversations,
  selectedId,
  query,
  type,
  contactId,
  nextCursor,
  blockedConversationIds = [],
  blockedContactIds = [],
}: ConversationListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(query || "");
  const [syncedQuery, setSyncedQuery] = useState(query || "");
  const [selecting, setSelecting] = useState(false);
  const conversationIds = useMemo(() => conversations.map((conversation) => conversation.id), [conversations]);
  const blockedConversations = useMemo(() => new Set(blockedConversationIds), [blockedConversationIds]);
  const blockedContacts = useMemo(() => new Set(blockedContactIds), [blockedContactIds]);

  // Resync when navigation changes the URL query (e.g. back button).
  if ((query || "") !== syncedQuery) {
    setSyncedQuery(query || "");
    setSearchValue(query || "");
  }

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

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const current = (query || "").trim();
      const next = searchValue.trim();
      if (current === next) return;
      const params = new URLSearchParams(searchParams.toString());
      if (next) params.set("q", next);
      else params.delete("q");
      params.delete("cursor");
      const qs = params.toString();
      const base = selectedId ? `/conversations/${encodeURIComponent(selectedId)}` : "/conversations";
      startTransition(() => {
        router.replace(qs ? `${base}?${qs}` : base);
      });
    }, 350);
    return () => window.clearTimeout(handle);
  }, [searchValue, query, router, searchParams, selectedId, startTransition]);

  function listQuery(extra?: Record<string, string>) {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (type) params.set("type", type);
    if (contactId) params.set("contact_id", contactId);
    if (extra) {
      for (const [key, value] of Object.entries(extra)) params.set(key, value);
    }
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  }

  function conversationHref(id: string) {
    return `/conversations/${encodeURIComponent(id)}${listQuery()}`;
  }

  function onTypeChange(nextType: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextType) params.set("type", nextType);
    else params.delete("type");
    params.delete("cursor");
    const qs = params.toString();
    const base = selectedId ? `/conversations/${encodeURIComponent(selectedId)}` : "/conversations";
    startTransition(() => {
      router.replace(qs ? `${base}?${qs}` : base);
    });
  }

  function onBulkDone(ids: string[]) {
    setSelecting(false);
    if (selectedId && ids.includes(selectedId)) {
      startTransition(() => router.push(`/conversations${listQuery()}`));
    } else {
      router.refresh();
    }
  }

  return (
    <BulkSelectionProvider ids={conversationIds} selecting={selecting} onSelectingChange={setSelecting}>
      <section className={`w-full shrink-0 border-r border-line bg-white lg:w-[360px] ${selectedId ? "hidden lg:block" : "block"}`}>
        <header className="border-b border-line p-4">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-xl font-semibold tracking-tight">Conversas</h1>
            {conversations.length > 0 && (
              <SelectModeToggle />
            )}
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={17} />
            <input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Buscar conversa"
              className="focus-ring h-10 w-full rounded-xl bg-slate-100 pl-10 pr-3 text-sm"
              autoComplete="off"
            />
          </div>
          <label className="mt-3 block">
            <span className="sr-only">Tipo</span>
            <select
              value={type || ""}
              onChange={(event) => onTypeChange(event.target.value)}
              className="focus-ring h-10 w-full rounded-xl bg-slate-100 px-3 text-sm"
            >
              <option value="">Todos os tipos</option>
              <option value="direct">Diretas</option>
              <option value="group">Grupos</option>
            </select>
          </label>
        </header>
        <div ref={listRef} className="scrollbar overflow-y-auto lg:h-[calc(100vh-161px)]">
          {selecting && <BulkSelectAll noun={conversationNoun} toggle={false} />}
          <BulkList>
          {conversations.length ? conversations.map((conversation) => {
            const name = conversation.title || "Conversa sem título";
            const message = conversation.last_message;
            const preview = message ? messageDisplay(message).text : "Sem mensagens";
            const selected = selectedId === conversation.id;
            const blocked = blockedConversations.has(conversation.id)
              || Boolean(conversation.contact_id && blockedContacts.has(conversation.contact_id));
            const content = (
              <>
                <Avatar name={name} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold">{name}</p>
                    <time className="shrink-0 text-[11px] text-muted">{formatDate(conversation.last_message_at, false)}</time>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <p className="min-w-0 flex-1 truncate text-xs text-muted">{preview}</p>
                    {conversation.type === "group" && (
                      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">Grupo</span>
                    )}
                    {blocked && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 ring-1 ring-inset ring-amber-200">
                        <Ban size={10} />Bloqueada
                      </span>
                    )}
                  </div>
                </div>
              </>
            );
            if (selecting) {
              return (
                <div
                  key={conversation.id}
                  data-bulk-row={conversation.id}
                  className="flex cursor-pointer items-center gap-3 border-b border-line p-4 transition hover:bg-slate-50 has-[[data-bulk]:checked]:bg-brand-soft/60"
                >
                  <BulkCheckbox id={conversation.id} label={name} />
                  {content}
                </div>
              );
            }
            return (
              <Link
                key={conversation.id}
                href={conversationHref(conversation.id)}
                scroll={false}
                onClick={() => {
                  if (listRef.current) sessionStorage.setItem(SCROLL_KEY, String(listRef.current.scrollTop));
                }}
                className={`focus-ring flex gap-3 border-b border-line p-4 transition ${selected ? "bg-brand-soft" : "hover:bg-slate-50"}`}
              >
                {content}
              </Link>
            );
          }) : <div className="p-8 text-center text-sm text-muted">Nenhuma conversa encontrada.</div>}
          </BulkList>
          {nextCursor && (
            <Link
              className="focus-ring m-4 block rounded-xl border border-line px-4 py-2.5 text-center text-xs font-semibold text-brand"
              href={`/conversations${listQuery({ cursor: nextCursor })}`}
            >
              Carregar conversas anteriores
            </Link>
          )}
        </div>
      </section>
      <BulkActionBar noun={conversationNoun} actions={bulkActions} onDone={onBulkDone} />
    </BulkSelectionProvider>
  );
}

function SelectModeToggle() {
  const { selecting, setSelecting } = useBulkSelection();
  return (
    <button
      type="button"
      onClick={() => setSelecting(!selecting)}
      className={`focus-ring inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${selecting ? "bg-brand-soft text-brand" : "text-muted hover:bg-slate-100 hover:text-ink"}`}
    >
      {selecting ? <X size={14} /> : <ListChecks size={14} />}
      {selecting ? "Fechar" : "Selecionar"}
    </button>
  );
}
