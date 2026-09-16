import { AlertTriangle, Inbox, LoaderCircle } from "lucide-react";

export function PageHeader({ eyebrow, title, description, action }: {
  eyebrow?: string; title: string; description?: string; action?: React.ReactNode;
}) {
  return <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
    <div>
      {eyebrow && <p className="mb-1 text-xs font-bold uppercase tracking-[.18em] text-brand">{eyebrow}</p>}
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
      {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</p>}
    </div>
    {action}
  </header>;
}

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "success" | "danger" | "neutral" | "warning" }) {
  const colors = { success: "bg-emerald-50 text-emerald-700 ring-emerald-200", danger: "bg-red-50 text-red-700 ring-red-200", warning: "bg-amber-50 text-amber-700 ring-amber-200", neutral: "bg-slate-50 text-slate-600 ring-slate-200" };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${colors[tone]}`}>{children}</span>;
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-surface p-8 text-center">
    <span className="mb-4 grid size-11 place-items-center rounded-full bg-brand-soft text-brand"><Inbox size={21} /></span>
    <h2 className="font-semibold">{title}</h2><p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
  </div>;
}

export function ErrorState({ reset }: { error?: Error; reset: () => void }) {
  return <div className="grid min-h-[60vh] place-items-center p-6"><div className="max-w-md text-center">
    <AlertTriangle className="mx-auto mb-4 text-red-600" size={32} /><h2 className="text-xl font-semibold">Algo não saiu como esperado</h2>
    <p className="mt-2 text-sm text-muted">Não foi possível buscar os dados. Verifique o serviço e tente novamente.</p>
    <button onClick={reset} className="focus-ring mt-5 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white">Tentar novamente</button>
  </div></div>;
}

export function LoadingBlock() {
  return <div className="grid min-h-[60vh] place-items-center text-muted"><span className="flex items-center gap-2 text-sm"><LoaderCircle className="animate-spin" size={18} /> Carregando dados...</span></div>;
}

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const dimensions = { sm: "size-9 text-xs", md: "size-11 text-sm", lg: "size-16 text-lg" };
  const letters = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?";
  return <span aria-hidden className={`grid shrink-0 place-items-center rounded-full bg-brand-soft font-bold text-brand ${dimensions[size]}`}>{letters}</span>;
}
