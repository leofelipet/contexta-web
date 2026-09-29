"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookMarked,
  CheckSquare,
  ContactRound,
  HardDrive,
  LogOut,
  Menu,
  MessageCircle,
  PlugZap,
  Search,
  Server,
  X,
} from "lucide-react";
import { useState } from "react";
import { logout } from "@/app/actions";

type NavItem = {
  href: string;
  label: string;
  icon: typeof BarChart3;
  match?: string[];
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const groups: NavGroup[] = [
  {
    label: "Principal",
    items: [
      { href: "/dashboard", label: "Visão geral", icon: BarChart3 },
      { href: "/conversations", label: "Conversas", icon: MessageCircle },
      { href: "/contacts", label: "Contatos", icon: ContactRound },
      { href: "/search", label: "Busca", icon: Search },
      { href: "/tarefas", label: "Tarefas", icon: CheckSquare, match: ["/tarefas", "/recorrentes"] },
      { href: "/memorias", label: "Memórias", icon: BookMarked },
    ],
  },
  {
    label: "Operação",
    items: [
      { href: "/denylist", label: "Manutenção", icon: HardDrive, match: ["/denylist", "/limpeza"] },
      { href: "/whatsapp", label: "Integrações", icon: PlugZap, match: ["/whatsapp", "/mcp", "/email"] },
      { href: "/sistema", label: "Sistema", icon: Server, match: ["/sistema", "/logs"] },
    ],
  },
];

const mobileItems: NavItem[] = [
  { href: "/conversations", label: "Conversas", icon: MessageCircle },
  { href: "/contacts", label: "Contatos", icon: ContactRound },
  { href: "/tarefas", label: "Tarefas", icon: CheckSquare, match: ["/tarefas", "/recorrentes"] },
  { href: "/search", label: "Busca", icon: Search },
];

function isActive(pathname: string, item: NavItem) {
  const prefixes = item.match || [item.href];
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function NavLinks({ close }: { close?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-6">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">{group.label}</p>
          <div className="space-y-1">
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item);
              return (
                <Link
                  key={item.href}
                  onClick={close}
                  href={item.href}
                  className={`focus-ring flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    active ? "bg-brand text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-ink"
                  }`}
                >
                  <Icon size={18} strokeWidth={active ? 2.3 : 1.8} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-paper md:pl-64">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line bg-white p-5 md:flex md:flex-col">
        <Brand />
        <div className="mt-9 flex-1 overflow-y-auto">
          <NavLinks />
        </div>
        <LogoutButton />
      </aside>
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line bg-white/95 px-4 backdrop-blur md:hidden">
        <Brand compact />
        <button aria-label="Abrir menu" onClick={() => setOpen(true)} className="focus-ring rounded-lg p-2">
          <Menu />
        </button>
      </header>
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button aria-label="Fechar menu" className="absolute inset-0 bg-ink/30" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 right-0 flex w-72 flex-col bg-white p-5 shadow-xl">
            <div className="mb-8 flex items-center justify-between">
              <Brand compact />
              <button aria-label="Fechar menu" onClick={() => setOpen(false)} className="p-2">
                <X />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <NavLinks close={() => setOpen(false)} />
            </div>
            <LogoutButton />
          </aside>
        </div>
      )}
      <main className="min-h-screen pb-20 md:pb-0">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-line bg-white px-1 pb-[env(safe-area-inset-bottom)] md:hidden">
        {mobileItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-2 text-[10px] font-semibold ${active ? "text-brand" : "text-muted"}`}
            >
              <Icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/dashboard" className="flex items-center gap-3">
      <span className="grid size-9 place-items-center rounded-xl bg-brand text-white">
        <MessageCircle size={20} fill="currentColor" />
      </span>
      <span className={`${compact ? "text-lg" : "text-xl"} font-bold tracking-tight`}>
        contexta<span className="text-brand">.</span>
      </span>
    </Link>
  );
}

function LogoutButton() {
  return (
    <form action={logout}>
      <button className="focus-ring flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted hover:bg-red-50 hover:text-red-700">
        <LogOut size={18} />
        Sair
      </button>
    </form>
  );
}
