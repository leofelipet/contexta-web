"use client";

import { createContext, useContext, useEffect, useMemo, useState, useTransition } from "react";
import { Ban, Check, CircleCheck, ListChecks, LoaderCircle, Minus, Pause, Play, Trash2, X } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { type BulkResult, countLabel, fillCount } from "@/lib/bulk";

type BulkSelectionState = {
  ids: string[];
  selected: Set<string>;
  selecting: boolean;
  setSelecting: (selecting: boolean) => void;
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

/**
 * Holds which of the listed ids are selected and whether the list is in
 * selection mode. Ids that leave the list drop out of the selection. Pass
 * `selecting` and `onSelectingChange` to control the mode from outside.
 */
export function BulkSelectionProvider({
  ids,
  selecting: controlledSelecting,
  onSelectingChange,
  children,
}: {
  ids: string[];
  selecting?: boolean;
  onSelectingChange?: (selecting: boolean) => void;
  children: React.ReactNode;
}) {
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [ownSelecting, setOwnSelecting] = useState(false);
  const selecting = controlledSelecting ?? ownSelecting;
  const selected = useMemo(() => new Set(ids.filter((id) => picked.has(id))), [ids, picked]);

  const state = useMemo<BulkSelectionState>(() => ({
    ids,
    selected,
    selecting,
    setSelecting: (next) => {
      if (!next) setPicked(new Set());
      setOwnSelecting(next);
      onSelectingChange?.(next);
    },
    toggle: (id) => setPicked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    }),
    setAll: (checked) => setPicked(checked ? new Set(ids) : new Set()),
    clear: () => setPicked(new Set()),
  }), [ids, selected, selecting, onSelectingChange]);

  useEffect(() => {
    if (!selecting) return;
    function onKey(event: KeyboardEvent) {
      // The confirm dialog handles its own Escape.
      if (event.key === "Escape" && !document.querySelector('[role="dialog"]')) state.setSelecting(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selecting, state]);

  return <BulkSelectionContext.Provider value={state}>{children}</BulkSelectionContext.Provider>;
}

/** Rounded checkbox in the brand color. The native input stays in the DOM for forms, focus, and `:checked` styling. */
export function Checkbox({
  checked,
  indeterminate = false,
  onChange,
  label,
  bulk = false,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  label: string;
  bulk?: boolean;
}) {
  const on = checked || indeterminate;
  return (
    <label className="group/checkbox relative grid size-5 shrink-0 cursor-pointer place-items-center" onClick={(event) => event.stopPropagation()}>
      <input
        type="checkbox"
        data-bulk={bulk || undefined}
        checked={checked}
        onChange={onChange}
        aria-label={label}
        aria-checked={indeterminate ? "mixed" : checked}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={`grid size-[18px] place-items-center rounded-[6px] border-[1.5px] transition-all duration-150 peer-focus-visible:ring-2 peer-focus-visible:ring-brand/40 peer-focus-visible:ring-offset-2 ${on ? "border-brand bg-brand text-white shadow-sm shadow-brand/30" : "border-slate-300 bg-white text-transparent group-hover/checkbox:border-brand/70 group-hover/checkbox:bg-brand-soft"}`}
      >
        {indeterminate
          ? <Minus size={12} strokeWidth={3.5} />
          : <Check size={12} strokeWidth={3.5} className={`transition-transform duration-150 ${checked ? "scale-100" : "scale-50"}`} />}
      </span>
    </label>
  );
}

/**
 * Row checkbox, hidden until the list enters selection mode. Rows can
 * highlight themselves with `has-[[data-bulk]:checked]:`.
 */
export function BulkCheckbox({ id, label }: { id: string; label: string }) {
  const { selected, selecting, toggle } = useBulkSelection();
  return (
    <span
      aria-hidden={!selecting}
      className={`grid shrink-0 place-items-center overflow-hidden transition-all duration-200 ${selecting ? "mr-0 w-5 opacity-100" : "-mr-3 w-0 opacity-0"}`}
    >
      {selecting && <Checkbox bulk checked={selected.has(id)} onChange={() => toggle(id)} label={`Selecionar ${label}`} />}
    </span>
  );
}

/**
 * List container. In selection mode a click anywhere on a `data-bulk-row`
 * toggles that row instead of following its link.
 */
export function BulkList({ className, children }: { className?: string; children: React.ReactNode }) {
  const { selecting, toggle } = useBulkSelection();
  return (
    <div
      className={className}
      data-selecting={selecting || undefined}
      onClickCapture={(event) => {
        if (!selecting) return;
        const target = event.target as HTMLElement;
        if (target.closest("button, input, label, form")) return;
        const row = target.closest<HTMLElement>("[data-bulk-row]");
        if (!row?.dataset.bulkRow) return;
        event.preventDefault();
        event.stopPropagation();
        toggle(row.dataset.bulkRow);
      }}
    >
      {children}
    </div>
  );
}

/**
 * List header. Outside selection mode it shows the item count and a
 * "Selecionar" button; inside it, the select-page checkbox. Pass
 * `toggle={false}` when the mode is switched elsewhere.
 */
export function BulkSelectAll({ noun, toggle = true }: { noun: readonly [string, string]; toggle?: boolean }) {
  const { ids, selected, selecting, setSelecting, setAll } = useBulkSelection();
  const all = ids.length > 0 && selected.size === ids.length;
  const some = selected.size > 0 && !all;

  return (
    <div className="flex min-h-11 items-center gap-3 border-b border-line bg-slate-50/70 px-4 py-2 text-xs font-medium text-muted">
      {selecting ? (
        <>
          <Checkbox checked={all} indeterminate={some} onChange={() => setAll(!all)} label="Selecionar todos da página" />
          <span className={selected.size ? "text-ink" : undefined}>
            {selected.size ? `${countLabel(selected.size, noun)} de ${ids.length}` : `Selecionar ${countLabel(ids.length, noun)} da página`}
          </span>
        </>
      ) : (
        <span>{countLabel(ids.length, noun)} nesta página</span>
      )}
      {toggle && (
        <button
          type="button"
          onClick={() => setSelecting(!selecting)}
          className={`focus-ring ml-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-semibold transition ${selecting ? "bg-brand-soft text-brand" : "text-muted hover:bg-white hover:text-ink"}`}
        >
          {selecting ? <X size={14} /> : <ListChecks size={14} />}
          {selecting ? "Fechar" : "Selecionar"}
        </button>
      )}
    </div>
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
  const { selected, setSelecting } = useBulkSelection();
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
        setSelecting(false);
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
        className={`pointer-events-none fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 flex justify-center px-3 transition-all duration-200 sm:px-4 md:bottom-5 ${visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
      >
        {count > 0 ? (
          <div className="pointer-events-auto flex max-w-full items-center gap-0.5 rounded-2xl bg-ink p-1 pl-3 text-sm text-white shadow-xl shadow-ink/20 sm:gap-1 sm:p-1.5 sm:pl-4">
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
                  className={`focus-ring inline-flex shrink-0 items-center gap-1.5 rounded-xl px-2 py-2 font-medium transition disabled:opacity-50 sm:px-3 ${action.tone === "danger" ? "text-red-300 hover:bg-red-500/15 hover:text-red-200" : "text-white/85 hover:bg-white/10 hover:text-white"}`}
                >
                  {busy ? <LoaderCircle size={15} className="animate-spin" /> : <Icon size={15} />}
                  {action.label}
                </button>
              );
            })}
            <button
              type="button"
              disabled={pending}
              onClick={() => setSelecting(false)}
              aria-label="Sair da seleção"
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
