"use client";

import { Suspense, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

function buildParams(current: URLSearchParams, updates: Record<string, string | null>) {
  const params = new URLSearchParams(current.toString());
  for (const [key, value] of Object.entries(updates)) {
    if (value == null || value === "") params.delete(key);
    else params.set(key, value);
  }
  params.delete("cursor");
  return params;
}

function LiveSearchInputInner({
  name = "q",
  defaultValue = "",
  placeholder = "Buscar...",
  className = "focus-ring h-10 w-full rounded-xl bg-slate-50 pl-10 pr-3 text-sm",
  debounceMs = 350,
}: {
  name?: string;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  debounceMs?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const current = searchParams.get(name) || "";
      const nextValue = value.trim();
      if (current === nextValue) return;
      const params = buildParams(searchParams, { [name]: nextValue || null });
      const query = params.toString();
      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname);
      });
    }, debounceMs);
    return () => window.clearTimeout(handle);
  }, [value, debounceMs, name, pathname, router, searchParams, startTransition]);

  return (
    <label className="relative min-w-0 flex-1">
      <span className="sr-only">Buscar</span>
      <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={17} />
      <input
        name={name}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
    </label>
  );
}

export function LiveSearchInput(props: {
  name?: string;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  debounceMs?: number;
}) {
  return (
    <Suspense fallback={<div className="h-10 min-w-52 flex-1 animate-pulse rounded-xl bg-slate-100" />}>
      <LiveSearchInputInner {...props} />
    </Suspense>
  );
}

function LiveSelectInner({
  name,
  label,
  value = "",
  options,
  className = "focus-ring h-10 rounded-xl border-0 bg-slate-50 px-3 text-sm text-slate-700",
}: {
  name: string;
  label: string;
  value?: string;
  options: Array<[string, string]>;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  return (
    <label>
      <span className="sr-only">{label}</span>
      <select
        name={name}
        value={value}
        onChange={(event) => {
          const params = buildParams(searchParams, { [name]: event.target.value || null });
          const query = params.toString();
          startTransition(() => {
            router.replace(query ? `${pathname}?${query}` : pathname);
          });
        }}
        className={className}
      >
        {options.map(([key, text]) => (
          <option value={key} key={key || "all"}>{text}</option>
        ))}
      </select>
    </label>
  );
}

export function LiveSelect(props: {
  name: string;
  label: string;
  value?: string;
  options: Array<[string, string]>;
  className?: string;
}) {
  return (
    <Suspense fallback={<div className="h-10 w-40 animate-pulse rounded-xl bg-slate-100" />}>
      <LiveSelectInner {...props} />
    </Suspense>
  );
}

function LiveCheckboxInner({
  name,
  label,
  checked = false,
  value = "1",
}: {
  name: string;
  label: string;
  checked?: boolean;
  value?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        name={name}
        value={value}
        checked={checked}
        onChange={(event) => {
          const params = buildParams(searchParams, { [name]: event.target.checked ? value : null });
          const query = params.toString();
          startTransition(() => {
            router.replace(query ? `${pathname}?${query}` : pathname);
          });
        }}
        className="size-4 rounded border-line"
      />
      <span>{label}</span>
    </label>
  );
}

export function LiveCheckbox(props: {
  name: string;
  label: string;
  checked?: boolean;
  value?: string;
}) {
  return (
    <Suspense fallback={<div className="h-5 w-28 animate-pulse rounded bg-slate-100" />}>
      <LiveCheckboxInner {...props} />
    </Suspense>
  );
}
