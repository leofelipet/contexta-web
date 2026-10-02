"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Ban, Check, CircleCheck, LoaderCircle, Pause, Play, Trash2, X } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { type BulkResult, countLabel, fillCount } from "@/lib/bulk";

type BulkSelectionState = {
  ids: string[];
  selected: Set<string>;
  toggle: (id: string) => void;
  setAll: (checked: boolean) => void;
  clear: () => void;
};

const BulkSelectionContext = createContext<BulkSelectionState | null>(null);

export function useBulkSelection() {
  const state = useContext(BulkSelectionContext);
  if (!state) throw new Error("Bulk selection components must be inside BulkSelectionProvider");
  return state;
}

/** Holds which of the listed ids are selected. Ids that leave the list drop out of the selection. */
export function BulkSelectionProvider({ ids, children }: { ids: string[]; children: React.ReactNode }) {
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const selected = useMemo(() => new Set(ids.filter((id) => picked.has(id))), [ids, picked]);

  const state = useMemo<BulkSelectionState>(() => ({
    ids,
    selected,
    toggle: (id) => setPicked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    }),
    setAll: (checked) => setPicked(checked ? new Set(ids) : new Set()),
    clear: () => setPicked(new Set()),
  }), [ids, selected]);

  return <BulkSelectionContext.Provider value={state}>{children}</BulkSelectionContext.Provider>;
}

const checkboxClass = "size-4 shrink-0 cursor-pointer rounded border-line accent-brand";

/** Row checkbox. Rows can highlight themselves with `has-[[data-bulk]:checked]:`. */
export function BulkCheckbox({ id, label }: { id: string; label: string }) {
  const { selected, toggle } = useBulkSelection();
  return (
    <input
      type="checkbox"
      data-bulk
      checked={selected.has(id)}
      onChange={() => toggle(id)}
      className={checkboxClass}
      aria-label={`Selecionar ${label}`}
    />
  );
}

export function BulkSelectAll({ noun }: { noun: readonly [string, string] }) {
  const { ids, selected, setAll } = useBulkSelection();
  const ref = useRef<HTMLInputElement>(null);
  const all = ids.length > 0 && selected.size === ids.length;
  const some = selected.size > 0 && !all;

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = some;
  }, [some]);

  return (
    <label className="flex cursor-pointer items-center gap-3 border-b border-line bg-slate-50/70 px-4 py-2.5 text-xs font-medium text-muted">
      <input ref={ref} type="checkbox" checked={all} onChange={() => setAll(!all)} className={checkboxClass} />
      {selected.size ? `${countLabel(selected.size, noun)} de ${ids.length}` : `Selecionar ${countLabel(ids.length, noun)} da página`}
    </label>
  );
}

const icons = { trash: Trash2, check: CircleCheck, cancel: Ban, pause: Pause, play: Play };

export type BulkAction = {
  label: string;
  icon: keyof typeof icons;
  tone?: "danger" | "neutral";
  run: (ids: string[]) => Promise<BulkResult>;
  /** Success message nouns, e.g. ["tarefa apagada", "tarefas apagadas"]. */
  done: readonly [string, string];
  /** {n} becomes the selection count with the bar's noun, e.g. "3 tarefas". */
  confirm?: { title: string; description: string; confirmLabel: string };
};

type Feedback = { tone: "success" | "error"; text: string };

/** Floating bar with the actions for the current selection. */
export function BulkActionBar({
  noun,
  actions,
  onDone,
}: {
  noun: readonly [string, string];
  actions: BulkAction[];
  onDone?: (ids: string[]) => void;
}) {
  const { selected, clear } = useBulkSelection();
  const [confirming, setConfirming] = useState<BulkAction | null>(null);
  const [running, setRunning] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!feedback) return;
    const handle = window.setTimeout(() => setFeedback(null), 4000);
    return () => window.clearTimeout(handle);
  }, [feedback]);

  function run(action: BulkAction) {
    const ids = [...selected];
    setRunning(action.label);
    startTransition(async () => {
      try {
        const result = await action.run(ids);
        clear();
        setFeedback({ tone: "success", text: `${countLabel(result.count, action.done)}.` });
        onDone?.(ids);
      } catch {
        setFeedback({ tone: "error", text: "Não foi possível concluir a ação. Tente novamente." });
      } finally {
        setConfirming(null);
        setRunning(null);
      }
    });
  }

  const count = selected.size;
  const visible = count > 0 || feedback;

  return (
    <>
      <div
        aria-live="polite"
        className={`pointer-events-none fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 md:bottom-5 flex justify-center px-3 sm:px-4 transition-all duration-200 ${visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
      >
        {count > 0 ? (
          <div className="pointer-events-auto flex max-w-full items-center gap-0.5 rounded-2xl bg-ink p-1 pl-3 text-sm text-white sm:p-1.5 shadow-xl shadow-ink/20 sm:gap-1 sm:pl-4">
            <span className="mr-1.5 font-semibold tabular-nums sm:mr-2">
              <span className="sm:hidden">{count}</span>
              <span className="hidden sm:inline">{countLabel(count, noun)}</span>
            </span>
            {actions.map((action) => {
              const Icon = icons[action.icon];
              const busy = pending && running === action.label;
              return (
                <button
                  key={action.label}
                  type="button"
                  disabled={pending}
                  onClick={() => (action.confirm ? setConfirming(action) : run(action))}
                  className={`focus-ring inline-flex shrink-0 items-center gap-1.5 rounded-xl px-2 py-2 font-medium transition sm:px-3 disabled:opacity-50 ${action.tone === "danger" ? "text-red-300 hover:bg-red-500/15 hover:text-red-200" : "text-white/85 hover:bg-white/10 hover:text-white"}`}
                >
                  {busy ? <LoaderCircle size={15} className="animate-spin" /> : <Icon size={15} />}
                  {action.label}
                </button>
              );
            })}
            <button
              type="button"
              disabled={pending}
              onClick={clear}
              aria-label="Limpar seleção"
              className="focus-ring ml-0.5 grid size-9 shrink-0 place-items-center rounded-xl text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-50"
            >
              <X size={16} />
            </button>
          </div>
        ) : feedback ? (
          <p className={`pointer-events-auto flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium shadow-lg ${feedback.tone === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>
            {feedback.tone === "success" ? <Check size={16} /> : <X size={16} />}
            {feedback.text}
          </p>
        ) : null}
      </div>

      {confirming?.confirm && (
        <ConfirmDialog
          open
          busy={pending}
          title={fillCount(confirming.confirm.title, count, noun)}
          description={fillCount(confirming.confirm.description, count, noun)}
          confirmLabel={confirming.confirm.confirmLabel}
          onCancel={() => { if (!pending) setConfirming(null); }}
          onConfirm={() => run(confirming)}
        />
      )}
    </>
  );
}
