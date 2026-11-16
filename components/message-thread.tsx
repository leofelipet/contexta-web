"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { LoaderCircle, Search, X } from "lucide-react";
import { formatDate } from "@/lib/format";
import { messageDisplay } from "@/lib/message-display";
import type { Message } from "@/lib/types";

type MessagePayload = Message[] | { data: Message[]; next_cursor?: string | null };

async function fetchMessages(conversationId: string, params: Record<string, string>) {
  const response = await fetch(`/api/conversations/${encodeURIComponent(conversationId)}/messages?${new URLSearchParams(params)}`);
  if (!response.ok) throw new Error();
  const payload = await response.json() as MessagePayload;
  return Array.isArray(payload) ? { items: payload, next: null } : { items: payload.data, next: payload.next_cursor ?? null };
}

export function MessageThread({ conversationId, initialMessages, initialCursor, isGroup = false }: { conversationId: string; initialMessages: Message[]; initialCursor?: string | null; isGroup?: boolean }) {
  const [messages, setMessages] = useState(initialMessages);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const viewportRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const previousHeightRef = useRef<number | null>(null);
  const previousCountRef = useRef(initialMessages.length);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Message[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [highlightId, setHighlightId] = useState("");

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    if (!initializedRef.current) {
      viewport.scrollTop = viewport.scrollHeight;
      initializedRef.current = true;
      previousCountRef.current = messages.length;
      return;
    }
    if (previousHeightRef.current !== null) {
      viewport.scrollTop += viewport.scrollHeight - previousHeightRef.current;
      previousHeightRef.current = null;
    } else if (messages.length > previousCountRef.current) {
      viewport.scrollTop = viewport.scrollHeight;
    }
    previousCountRef.current = messages.length;
  }, [messages]);

  useEffect(() => {
    const source = new EventSource("/api/events");
    source.addEventListener("messages", () => {
      void (async () => {
        try {
          const response = await fetch(`/api/conversations/${encodeURIComponent(conversationId)}/messages?limit=50`);
          if (!response.ok) return;
          const payload = await response.json() as Message[] | { data: Message[] };
          const newest = [...(Array.isArray(payload) ? payload : payload.data)].reverse();
          setMessages((current) => {
            const ids = new Set(current.map((item) => item.id));
            const extra = newest.filter((item) => !ids.has(item.id));
            if (!extra.length) {
              return current.map((item) => newest.find((fresh) => fresh.id === item.id) ?? item);
            }
            return [...current, ...extra];
          });
        } catch {
          // keep the open thread; the next event retries
        }
      })();
    });
    return () => source.close();
  }, [conversationId]);

  async function loadOlder() {
    if (!cursor || loading) return;
    setLoading(true); setError("");
    try {
      const { items, next } = await fetchMessages(conversationId, { cursor, limit: "50" });
      previousHeightRef.current = viewportRef.current?.scrollHeight ?? null;
      prepend(items);
      setCursor(next);
    } catch { setError("Não foi possível carregar mensagens anteriores."); }
    finally { setLoading(false); }
  }

  function prepend(older: Message[]) {
    const chronological = [...older].reverse();
    setMessages((current) => [...chronological.filter((item) => !current.some((existing) => existing.id === item.id)), ...current]);
  }

  async function search(event: React.FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;
    setSearching(true); setError("");
    try { setResults((await fetchMessages(conversationId, { query: query.trim(), limit: "50" })).items); }
    catch { setError("Não foi possível buscar mensagens."); }
    finally { setSearching(false); }
  }

  // Pages older messages in until the hit is in the thread, then scrolls to it.
  async function jumpTo(id: string) {
    setSearching(true); setError("");
    try {
      let next = cursor;
      let loaded = messages.some((item) => item.id === id);
      while (!loaded && next) {
        const page = await fetchMessages(conversationId, { cursor: next, limit: "100" });
        previousHeightRef.current = viewportRef.current?.scrollHeight ?? null;
        prepend(page.items);
        next = page.next;
        loaded = page.items.some((item) => item.id === id);
      }
      setCursor(next);
      setResults(null);
      setHighlightId(id);
      requestAnimationFrame(() => requestAnimationFrame(() => document.getElementById(`msg-${id}`)?.scrollIntoView({ block: "center" })));
    } catch { setError("Não foi possível abrir a mensagem."); }
    finally { setSearching(false); }
  }

  function closeSearch() { setSearchOpen(false); setQuery(""); setResults(null); setHighlightId(""); }

  return <div ref={viewportRef} className="chat-grid scrollbar min-h-0 flex-1 overflow-y-auto px-3 pb-[calc(5.25rem+env(safe-area-inset-bottom))] pt-4 sm:px-4 md:px-8 md:pb-5">
    <div className="mx-auto flex max-w-3xl flex-col gap-2">
      <div className="sticky top-0 z-10 -mt-2 mb-1 flex justify-end">
        {searchOpen
          ? <form onSubmit={search} className="flex w-full items-center gap-2 rounded-xl border border-line bg-white px-3 py-1.5 shadow-sm">
              <Search size={16} className="shrink-0 text-muted" />
              <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar nesta conversa" aria-label="Buscar nesta conversa" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
              {searching && <LoaderCircle className="animate-spin text-muted" size={14} />}
              <button type="button" onClick={closeSearch} aria-label="Fechar busca" className="focus-ring rounded-lg p-1 text-muted hover:bg-slate-100"><X size={16} /></button>
            </form>
          : <button onClick={() => setSearchOpen(true)} aria-label="Buscar nesta conversa" className="focus-ring rounded-full bg-white p-2 text-muted shadow-sm hover:text-ink"><Search size={16} /></button>}
      </div>
      {results && <div className="sticky top-12 z-10 max-h-[50vh] overflow-y-auto rounded-xl border border-line bg-white shadow-md">
        {results.length
          ? results.map((message) => <button key={message.id} onClick={() => void jumpTo(message.id)} disabled={searching} className="focus-ring block w-full border-b border-line px-3 py-2 text-left last:border-b-0 hover:bg-slate-50">
              <p className="line-clamp-2 text-sm">{messageDisplay(message).text}</p>
              <p className="mt-0.5 text-[11px] text-muted">{message.direction === "outbound" ? "Enviada" : message.sender?.trim() || "Recebida"} · {formatDate(message.timestamp)}</p>
            </button>)
          : <p className="px-3 py-3 text-sm text-muted">Nenhuma mensagem encontrada.</p>}
      </div>}
      {cursor && <button onClick={loadOlder} disabled={loading} className="focus-ring mx-auto mb-3 flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-muted shadow-sm">{loading && <LoaderCircle className="animate-spin" size={14} />}Carregar mensagens anteriores</button>}
      {error && <p className="mb-2 text-center text-xs text-red-700">{error}</p>}
      {!messages.length && <p className="mx-auto mt-20 rounded-xl bg-white/80 px-4 py-3 text-sm text-muted">Ainda não há mensagens nesta conversa.</p>}
      {messages.map((message) => {
        const outbound = message.direction === "outbound";
        const display = messageDisplay(message);
        const senderLabel = isGroup && !outbound && message.sender?.trim() ? message.sender.trim() : null;
        return <div key={message.id} id={`msg-${message.id}`} className={`max-w-[92%] overflow-hidden rounded-2xl px-3.5 py-2.5 shadow-sm sm:max-w-[88%] md:max-w-[72%] ${outbound ? "ml-auto rounded-br-md bg-[#d9fdd3]" : "mr-auto rounded-bl-md bg-white"} ${message.id === highlightId ? "ring-2 ring-amber-400" : ""}`}>
          {senderLabel && <p className="mb-0.5 text-[11px] font-semibold text-brand">{senderLabel}</p>}
          {display.audioLabel && <p className="mb-1 text-[11px] font-semibold text-brand">{display.audioLabel}</p>}
          <p className="whitespace-pre-wrap break-words text-sm leading-5">{display.text}</p>
          <div className="mt-1 flex flex-wrap items-center justify-end gap-x-1.5 gap-y-0.5 text-[10px] text-muted"><time>{formatDate(message.timestamp)}</time>{outbound && message.status && <span>· {message.status}</span>}</div>
        </div>;
      })}
    </div>
  </div>;
}
