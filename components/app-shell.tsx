"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Ban, BarChart3, Bot, ContactRound, HardDrive, LogOut, Menu, MessageCircle, ScrollText, Search, Server, Unplug, X } from "lucide-react";
import { useState } from "react";
import { logout } from "@/app/actions";

const items = [
  { href: "/dashboard", label: "Visão geral", icon: BarChart3 },
  { href: "/conversations", label: "Conversas", icon: MessageCircle },
  { href: "/contacts", label: "Contatos", icon: ContactRound },
  { href: "/search", label: "Busca", icon: Search },
  { href: "/denylist", label: "Deny list", icon: Ban },
  { href: "/limpeza", label: "Limpeza", icon: HardDrive },
  { href: "/whatsapp", label: "WhatsApp", icon: Unplug },
  { href: "/mcp", label: "MCP", icon: Bot },
  { href: "/logs", label: "Atividade", icon: ScrollText },
  { href: "/sistema", label: "Sistema", icon: Server },
];

function NavLinks({ close }: { close?: () => void }) {
  const pathname = usePathname();
  return <nav className="space-y-1">{items.map(({ href, label, icon: Icon }) => {
    const active = pathname === href || pathname.startsWith(`${href}/`);
    return <Link key={href} onClick={close} href={href} className={`focus-ring flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? "bg-brand text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-ink"}`}>
      <Icon size={18} strokeWidth={active ? 2.3 : 1.8} />{label}
    </Link>;
  })}</nav>;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const mobileItems = items.slice(0, 4);
  return <div className="min-h-screen bg-paper md:pl-64">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line bg-white p-5 md:flex md:flex-col">
      <Brand /><div className="mt-9 flex-1"><NavLinks /></div><LogoutButton />
    </aside>
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line bg-white/95 px-4 backdrop-blur md:hidden">
      <Brand compact /><button aria-label="Abrir menu" onClick={() => setOpen(true)} className="focus-ring rounded-lg p-2"><Menu /></button>
    </header>
    {open && <div className="fixed inset-0 z-50 md:hidden"><button aria-label="Fechar menu" className="absolute inset-0 bg-ink/30" onClick={() => setOpen(false)} /><aside className="absolute inset-y-0 right-0 flex w-72 flex-col bg-white p-5 shadow-xl"><div className="mb-8 flex items-center justify-between"><Brand compact /><button aria-label="Fechar menu" onClick={() => setOpen(false)} className="p-2"><X /></button></div><div className="flex-1"><NavLinks close={() => setOpen(false)} /></div><LogoutButton /></aside></div>}
    <main className="min-h-screen pb-20 md:pb-0">{children}</main>
    <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-line bg-white px-1 pb-[env(safe-area-inset-bottom)] md:hidden">{mobileItems.map(({ href, label, icon: Icon }) => { const active = pathname === href || pathname.startsWith(`${href}/`); return <Link key={href} href={href} className={`flex flex-col items-center gap-1 py-2 text-[10px] font-semibold ${active ? "text-brand" : "text-muted"}`}><Icon size={20} />{label}</Link>; })}</nav>
  </div>;
}

function Brand({ compact = false }: { compact?: boolean }) {
  return <Link href="/dashboard" className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-brand text-white"><MessageCircle size={20} fill="currentColor" /></span><span className={`${compact ? "text-lg" : "text-xl"} font-bold tracking-tight`}>contexta<span className="text-brand">.</span></span></Link>;
}

function LogoutButton() {
  return <form action={logout}><button className="focus-ring flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted hover:bg-red-50 hover:text-red-700"><LogOut size={18} />Sair</button></form>;
}
