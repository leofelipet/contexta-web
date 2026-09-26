"use client";

import { useState, useTransition } from "react";
import { Ban } from "lucide-react";
import { addDenylistEntry } from "@/app/actions";
import { ConfirmDialog } from "@/components/confirm-dialog";

export function BlockConversationButton({
  conversationId,
  conversationName,
  alreadyBlocked = false,
}: {
  conversationId: string;
  conversationName: string;
  alreadyBlocked?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  if (alreadyBlocked) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-200">
        <Ban size={14} />Bloqueada
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        aria-label="Bloquear conversa"
        onClick={() => setOpen(true)}
        className="focus-ring rounded-lg p-2 text-muted hover:bg-red-50 hover:text-red-700"
        title="Bloquear conversa"
      >
        <Ban size={20} />
      </button>
      <ConfirmDialog
        open={open}
        busy={pending}
        title="Bloquear conversa?"
        description={`Novas mensagens de “${conversationName}” deixarão de ser salvas. O histórico existente permanece.`}
        confirmLabel="Bloquear"
        cancelLabel="Cancelar"
        onCancel={() => { if (!pending) setOpen(false); }}
        onConfirm={() => {
          startTransition(async () => {
            const formData = new FormData();
            formData.set("target_type", "conversation");
            formData.set("target_id", conversationId);
            formData.set("reason", `Bloqueada pela tela da conversa`);
            formData.set("redirect_to", `/denylist?added=1`);
            await addDenylistEntry(formData);
          });
        }}
      />
    </>
  );
}
