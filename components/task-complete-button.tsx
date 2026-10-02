"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { completeTask } from "@/app/actions";

/**
 * Marks one task as done. The row fades out right away (rows style themselves
 * with `has-[[data-completing]]:`) and leaves the list when the page refreshes.
 */
export function TaskCompleteButton({ id, title }: { id: string; title: string }) {
  const [completing, setCompleting] = useState(false);
  const [failed, setFailed] = useState(false);
  const [, startTransition] = useTransition();

  function complete() {
    setCompleting(true);
    setFailed(false);
    startTransition(async () => {
      try {
        await completeTask(id);
      } catch {
        setCompleting(false);
        setFailed(true);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={complete}
      disabled={completing}
      data-completing={completing || undefined}
      title={failed ? "Não foi possível concluir. Tente novamente." : "Marcar como concluída"}
      aria-label={`Marcar #${id} - ${title} como concluída`}
      className={`focus-ring group/complete grid size-8 shrink-0 place-items-center rounded-full transition ${failed ? "text-red-600" : "text-muted hover:text-emerald-600"}`}
    >
      <span
        className={`grid size-5 place-items-center rounded-full border-[1.5px] transition ${completing ? "border-emerald-600 bg-emerald-600 text-white" : failed ? "border-red-500" : "border-current group-hover/complete:bg-emerald-50"}`}
      >
        <Check size={12} strokeWidth={3} className={`transition ${completing ? "opacity-100" : "opacity-0 group-hover/complete:opacity-100"}`} />
      </span>
    </button>
  );
}
