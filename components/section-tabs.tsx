"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SectionTabs({ items }: { items: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <div className="mb-6 flex flex-wrap gap-1 rounded-xl border border-line bg-white p-1">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`focus-ring rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
              active ? "bg-brand text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-ink"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

export const manutencaoTabs = [
  { href: "/denylist", label: "Deny list" },
  { href: "/limpeza", label: "Limpeza" },
] as const;

export const integracoesTabs = [
  { href: "/whatsapp", label: "WhatsApp" },
  { href: "/mcp", label: "MCP" },
] as const;

export const sistemaTabs = [
  { href: "/sistema", label: "Saúde" },
  { href: "/logs", label: "Atividade" },
] as const;
