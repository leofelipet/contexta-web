"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { deleteStaleConversationsBulk } from "@/app/actions";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DeleteConversationButton } from "@/components/delete-conversation-button";
import { Badge, EmptyState } from "@/components/ui";
import { formatDate } from "@/lib/format";
import type { StaleConversation } from "@/lib/types";

export function LimpezaList({
  conversations,
  days,
  nextCursor,
}: {
  conversations: StaleConversation[];
  days: number;
  nextCursor?: string | null;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const selectedItems = useMemo(
    () => conversations.filter((item) => selected.has(item.id)),
    [conversations, selected],
  );
  const selectedMessages = selectedItems.reduce((sum, item) => sum + (item.message_count || 0), 0);
  const allSelected = conversations.length > 0 && conversations.every((item) => selected.has(item.id));

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(conversations.map((item) => item.id)));
  }

  function toggleOne(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (!conversations.length) {
    return <EmptyState title="Nenhuma conversa inativa" description={`Não há conversas com mais de ${days} dias sem mensagens.`} />;
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={allSelected} onChange={toggleAll} className="size-4 rounded border-line" />
          Selecionar página
        </label>
        <button
          type="button"
          disabled={selected.size === 0}
          onClick={() => setOpen(true)}
          className="focus-ring inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Trash2 size={16} />
          Apagar selecionadas ({selected.size})
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        {conversations.map((conversation) => {
          const title = conversation.title || "Conversa sem título";
          const kind = conversation.type === "group" ? "Grupo" : conversation.type === "direct" ? "Direta" : conversation.type;
          return (
            <div key={conversation.id} className="flex flex-wrap items-center gap-4 border-b border-line p-4 last:border-0">
              <input
                type="checkbox"
                checked={selected.has(conversation.id)}
                onChange={() => toggleOne(conversation.id)}
                className="size-4 rounded border-line"
                aria-label={`Selecionar ${title}`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold">{title}</p>
                  <Badge tone="neutral">{kind}</Badge>
                  {conversation.blocked && <Badge tone="warning">Bloqueada</Badge>}
                </div>
                <p className="mt-1 text-xs text-muted">
                  {conversation.message_count.toLocaleString("pt-BR")} mensagens
                  {conversation.blocked ? " · bloqueada" : ` · inativa há ${conversation.inactive_days} dias`}
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
      </div>

      {nextCursor && (
        <Link
          href={`?${new URLSearchParams({ days: String(days), cursor: nextCursor }).toString()}`}
          className="focus-ring mt-5 inline-flex rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold"
        >
          Próxima página
        </Link>
      )}

      <ConfirmDialog
        open={open}
        busy={pending}
        title={`Apagar ${selected.size} conversa(s)?`}
        description={`${selected.size.toLocaleString("pt-BR")} conversa(s) e ${selectedMessages.toLocaleString("pt-BR")} mensagem(ns) serão removidas permanentemente. Esta ação não pode ser desfeita.`}
        confirmLabel="Apagar selecionadas"
        cancelLabel="Cancelar"
        onCancel={() => { if (!pending) setOpen(false); }}
        onConfirm={() => {
          startTransition(async () => {
            const formData = new FormData();
            for (const id of selected) formData.append("ids", id);
            await deleteStaleConversationsBulk(formData);
          });
        }}
      />
    </>
  );
}
