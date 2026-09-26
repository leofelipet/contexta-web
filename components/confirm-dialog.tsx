"use client";

import { useEffect } from "react";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label="Fechar" className="absolute inset-0 bg-ink/40" onClick={busy ? undefined : onCancel} />
      <div role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title" className="relative z-10 w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-xl">
        <h2 id="confirm-dialog-title" className="text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" disabled={busy} onClick={onCancel} className="focus-ring rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink hover:bg-slate-50 disabled:opacity-60">
            {cancelLabel}
          </button>
          <button type="button" disabled={busy} onClick={onConfirm} className="focus-ring rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
