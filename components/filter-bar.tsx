"use client";

import { LiveSearchInput } from "@/components/live-filters";

export function FilterBar({
  children,
  placeholder = "Buscar...",
  defaultValue,
  showSearch = true,
}: {
  children?: React.ReactNode;
  placeholder?: string;
  defaultValue?: string;
  showSearch?: boolean;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-white p-3">
      {showSearch && (
        <LiveSearchInput
          name="q"
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="focus-ring h-10 w-full rounded-xl bg-slate-50 pl-10 pr-3 text-sm"
        />
      )}
      {children}
    </div>
  );
}

export { LiveSelect as SelectFilter } from "@/components/live-filters";
