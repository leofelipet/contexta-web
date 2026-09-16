"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { formatDate } from "@/lib/format";
import { messageDisplay } from "@/lib/message-display";
import type { Message } from "@/lib/types";

export function MessageThread({ conversationId, initialMessages, initialCursor }: { conversationId: string; initialMessages: Message[]; initialCursor?: string | null }) {
  const [messages, setMessages] = useState(initialMessages);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const viewportRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const previousHeightRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    if (!initializedRef.current) {
      viewport.scrollTop = viewport.scrollHeight;
      initializedRef.current = true;
      return;
    }
    if (previousHeightRef.current !== null) {
      viewport.scrollTop += viewport.scrollHeight - previousHeightRef.current;
      previousHeightRef.current = null;
    }
  }, [messages]);

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

  return <div ref={viewportRef} className="chat-grid scrollbar flex-1 overflow-y-auto px-4 pb-24 pt-5 md:px-8 md:pb-5">
    <div className="mx-auto flex max-w-3xl flex-col gap-2">
      {cursor && <button onClick={loadOlder} disabled={loading} className="focus-ring mx-auto mb-3 flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-muted shadow-sm">{loading && <LoaderCircle className="animate-spin" size={14} />}Carregar mensagens anteriores</button>}
      {error && <p className="mb-2 text-center text-xs text-red-700">{error}</p>}
      {!messages.length && <p className="mx-auto mt-20 rounded-xl bg-white/80 px-4 py-3 text-sm text-muted">Ainda não há mensagens nesta conversa.</p>}
      {messages.map((message) => { const outbound = message.direction === "outbound"; const display = messageDisplay(message); return <div key={message.id} className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 shadow-sm md:max-w-[72%] ${outbound ? "ml-auto rounded-br-md bg-[#d9fdd3]" : "mr-auto rounded-bl-md bg-white"}`}>{display.audioLabel && <p className="mb-1 text-[11px] font-semibold text-brand">{display.audioLabel}</p>}<p className="whitespace-pre-wrap break-words text-sm leading-5">{display.text}</p><div className="mt-1 flex items-center justify-end gap-1.5 text-[10px] text-muted"><time>{formatDate(message.timestamp)}</time>{outbound && message.status && <span>· {message.status}</span>}</div></div>; })}
    </div>
  </div>;
}
