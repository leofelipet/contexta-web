import { Search } from "lucide-react";

export function FilterBar({ children, placeholder = "Buscar...", defaultValue, showSearch = true }: { children?: React.ReactNode; placeholder?: string; defaultValue?: string; showSearch?: boolean }) {
  return <form className="mb-5 flex flex-wrap gap-2 rounded-2xl border border-line bg-white p-3">
    {showSearch && <label className="relative min-w-52 flex-1"><span className="sr-only">Buscar</span><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={17} /><input name="q" defaultValue={defaultValue} placeholder={placeholder} className="focus-ring h-10 w-full rounded-xl bg-slate-50 pl-10 pr-3 text-sm" /></label>}
    {children}<button className="focus-ring h-10 rounded-xl bg-ink px-4 text-sm font-semibold text-white">Filtrar</button>
  </form>;
}

export function SelectFilter({ name, label, value, options }: { name: string; label: string; value?: string; options: Array<[string, string]> }) {
  return <label><span className="sr-only">{label}</span><select name={name} defaultValue={value} className="focus-ring h-10 rounded-xl border-0 bg-slate-50 px-3 text-sm text-slate-700">{options.map(([key, text]) => <option value={key} key={key}>{text}</option>)}</select></label>;
}
