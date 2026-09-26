"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteStaleConversation } from "@/app/actions";
import { ConfirmDialog } from "@/components/confirm-dialog";

export function DeleteConversationButton({
  conversationId,
  conversationTitle,
  messageCount,
}: {
  conversationId: string;
  conversationTitle: string;
  messageCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <button
        type="button"
        aria-label="Apagar conversa"
        onClick={() => setOpen(true)}
        className="focus-ring rounded-lg p-2 text-muted hover:bg-red-50 hover:text-red-700"
        title="Apagar conversa"
      >
        <Trash2 size={16} />
      </button>
      <ConfirmDialog
        open={open}
        busy={pending}
        title="Apagar conversa?"
        description={`“${conversationTitle}” e ${messageCount.toLocaleString("pt-BR")} mensagem(ns) serão removidas permanentemente do banco. Esta ação não pode ser desfeita.`}
        confirmLabel="Apagar"
        cancelLabel="Cancelar"
        onCancel={() => { if (!pending) setOpen(false); }}
        onConfirm={() => {
          startTransition(async () => {
            const formData = new FormData();
            formData.set("id", conversationId);
            await deleteStaleConversation(formData);
          });
        }}
      />
    </>
  );
}
