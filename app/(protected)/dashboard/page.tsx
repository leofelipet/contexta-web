import type { Metadata } from "next";
import Link from "next/link";
import { Activity, ContactRound, MessageCircle, MessagesSquare, PlugZap } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { Dashboard } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { Badge, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Visão geral" };

export default async function DashboardPage() {
  const data = await apiFetch<Dashboard>("/api/v1/dashboard");
  const stats = [{ label: "Contatos", value: data.contacts, icon: ContactRound, href: "/contacts" }, { label: "Conversas", value: data.conversations, icon: MessagesSquare, href: "/conversations" }, { label: "Mensagens", value: data.messages, icon: MessageCircle, href: "/search" }];
  const online = ["connected", "online", "open"].includes(data.uazapi_status?.toLowerCase());
  return <div className="mx-auto max-w-7xl p-5 md:p-9 lg:p-12"><PageHeader eyebrow="Operação" title="Visão geral" description="Um retrato rápido da sua central de conversas." action={<Badge tone={online ? "success" : "warning"}>{online ? "WhatsApp conectado" : `WhatsApp: ${data.uazapi_status || "indisponível"}`}</Badge>} />
    <section className="grid gap-4 sm:grid-cols-3">{stats.map(({ label, value, icon: Icon, href }) => <Link href={href} key={label} className="group rounded-2xl border border-line bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand"><Icon size={20} /></span><p className="mt-6 text-3xl font-semibold tracking-tight">{value.toLocaleString("pt-BR")}</p><p className="mt-1 text-sm text-muted">{label}</p></Link>)}</section>
    <section className="mt-6 grid gap-5 lg:grid-cols-[1.35fr_.65fr]"><div className="rounded-2xl border border-line bg-white p-6"><div className="flex items-center gap-2"><Activity size={19} className="text-brand" /><h2 className="font-semibold">Pulso da operação</h2></div><div className="mt-6 grid gap-5 sm:grid-cols-3"><Info label="Última mensagem" value={formatDate(data.last_message_at)} /><Info label="Último webhook" value={formatDate(data.last_webhook_at)} /><Info label="Versão" value={data.version ? `v${data.version}` : "—"} /></div></div><Link href="/whatsapp" className="rounded-2xl bg-[#153c31] p-6 text-white"><PlugZap className="text-emerald-300" /><h2 className="mt-8 text-lg font-semibold">Integração WhatsApp</h2><p className="mt-2 text-sm leading-6 text-white/65">Confira conexão, login e configuração do webhook.</p><span className="mt-5 inline-block text-sm font-semibold text-emerald-300">Ver integração →</span></Link></section>
  </div>;
}

function Info({ label, value }: { label: string; value: string }) { return <div className="border-l-2 border-brand-soft pl-4"><p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p><p className="mt-2 text-sm font-medium">{value}</p></div>; }
