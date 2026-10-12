"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { formatDate } from "@/lib/format";
import { messageDisplay } from "@/lib/message-display";
import type { Message } from "@/lib/types";

export function MessageThread({ conversationId, initialMessages, initialCursor, isGroup = false }: { conversationId: string; initialMessages: Message[]; initialCursor?: string | null; isGroup?: boolean }) {
  const [messages, setMessages] = useState(initialMessages);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const viewportRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const previousHeightRef = useRef<number | null>(null);
  const previousCountRef = useRef(initialMessages.length);

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
      const params = new URLSearchParams({ cursor, limit: "50" });
      const response = await fetch(`/api/conversations/${encodeURIComponent(conversationId)}/messages?${params}`);
      if (!response.ok) throw new Error();
      const payload = await response.json() as Message[] | { data: Message[]; next_cursor?: string | null };
      const older = Array.isArray(payload) ? payload : payload.data;
      const chronological = [...older].reverse();
      previousHeightRef.current = viewportRef.current?.scrollHeight ?? null;
      setMessages((current) => [...chronological.filter((item) => !current.some((existing) => existing.id === item.id)), ...current]);
      setCursor(Array.isArray(payload) ? null : payload.next_cursor);
    } catch { setError("Não foi possível carregar mensagens anteriores."); }
    finally { setLoading(false); }
  }

  return <div ref={viewportRef} className="chat-grid scrollbar min-h-0 flex-1 overflow-y-auto px-3 pb-[calc(5.25rem+env(safe-area-inset-bottom))] pt-4 sm:px-4 md:px-8 md:pb-5">
    <div className="mx-auto flex max-w-3xl flex-col gap-2">
      {cursor && <button onClick={loadOlder} disabled={loading} className="focus-ring mx-auto mb-3 flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-muted shadow-sm">{loading && <LoaderCircle className="animate-spin" size={14} />}Carregar mensagens anteriores</button>}
      {error && <p className="mb-2 text-center text-xs text-red-700">{error}</p>}
      {!messages.length && <p className="mx-auto mt-20 rounded-xl bg-white/80 px-4 py-3 text-sm text-muted">Ainda não há mensagens nesta conversa.</p>}
      {messages.map((message) => {
        const outbound = message.direction === "outbound";
        const display = messageDisplay(message);
        const senderLabel = isGroup && !outbound && message.sender?.trim() ? message.sender.trim() : null;
        return <div key={message.id} className={`max-w-[92%] overflow-hidden rounded-2xl px-3.5 py-2.5 shadow-sm sm:max-w-[88%] md:max-w-[72%] ${outbound ? "ml-auto rounded-br-md bg-[#d9fdd3]" : "mr-auto rounded-bl-md bg-white"}`}>
          {senderLabel && <p className="mb-0.5 text-[11px] font-semibold text-brand">{senderLabel}</p>}
          {display.audioLabel && <p className="mb-1 text-[11px] font-semibold text-brand">{display.audioLabel}</p>}
          <p className="whitespace-pre-wrap break-words text-sm leading-5">{display.text}</p>
          <div className="mt-1 flex flex-wrap items-center justify-end gap-x-1.5 gap-y-0.5 text-[10px] text-muted"><time>{formatDate(message.timestamp)}</time>{outbound && message.status && <span>· {message.status}</span>}</div>
        </div>;
      })}
    </div>
  </div>;
}
