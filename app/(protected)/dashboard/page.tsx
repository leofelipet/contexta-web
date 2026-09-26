import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  ContactRound,
  MessageCircle,
  MessagesSquare,
  PlugZap,
  Users,
  UsersRound,
} from "lucide-react";
import { DirectionChart, MessageTypesChart, TrafficChart } from "@/components/dashboard-charts";
import { Badge, PageHeader } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Dashboard } from "@/lib/types";

export const metadata: Metadata = { title: "Visão geral" };

export default async function DashboardPage() {
  const data = await apiFetch<Dashboard>("/api/v1/dashboard");
  const online = ["connected", "online", "open"].includes(data.uazapi_status?.toLowerCase());
  const totalDirected = (data.messages_inbound || 0) + (data.messages_outbound || 0);
  const inboundShare = totalDirected ? Math.round((data.messages_inbound / totalDirected) * 100) : 0;

  return (
    <div className="mx-auto max-w-7xl p-5 md:p-9 lg:p-12">
      <PageHeader
        eyebrow="Operação"
        title="Visão geral"
        description="Macro das mensagens: volume, direção, tipos e conversas mais ativas."
        action={<Badge tone={online ? "success" : "warning"}>{online ? "WhatsApp conectado" : `WhatsApp: ${data.uazapi_status || "indisponível"}`}</Badge>}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Mensagens" value={data.messages} hint={`${(data.messages_last_7d || 0).toLocaleString("pt-BR")} nos últimos 7 dias`} href="/search" icon={MessageCircle} />
        <StatCard label="Recebidas" value={data.messages_inbound} hint={`${inboundShare}% do total com direção`} href="/search?direction=inbound" icon={ArrowDownLeft} />
        <StatCard label="Enviadas" value={data.messages_outbound} hint={`${100 - inboundShare}% do total com direção`} href="/search?direction=outbound" icon={ArrowUpRight} />
        <StatCard label="Conversas ativas (7d)" value={data.active_conversations_7d} hint={`${(data.conversations || 0).toLocaleString("pt-BR")} no total`} href="/conversations" icon={MessagesSquare} />
      </section>

      <section className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Contatos" value={data.contacts} href="/contacts" icon={ContactRound} />
        <MiniStat label="Grupos" value={data.groups} href="/conversations?type=group" icon={UsersRound} />
        <MiniStat label="Diretas" value={data.directs} href="/conversations?type=direct" icon={Users} />
        <MiniStat label="Mensagens (30d)" value={data.messages_last_30d} href="/search" icon={Activity} />
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-[1.6fr_.9fr]">
        <article className="rounded-2xl border border-line bg-white p-6 shadow-sm">
          <div className="mb-1 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-semibold">Tráfego diário</h2>
              <p className="mt-1 text-sm text-muted">Recebidas × enviadas nos últimos 14 dias</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="inline-flex items-center gap-1.5 text-brand"><span className="size-2 rounded-full bg-brand" />Recebidas</span>
              <span className="inline-flex items-center gap-1.5 text-sky-600"><span className="size-2 rounded-full bg-sky-500" />Enviadas</span>
            </div>
          </div>
          <TrafficChart data={data.traffic || []} />
        </article>

        <article className="rounded-2xl border border-line bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Direção das mensagens</h2>
          <p className="mt-1 text-sm text-muted">Proporção histórica no banco</p>
          <DirectionChart inbound={data.messages_inbound || 0} outbound={data.messages_outbound || 0} />
        </article>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-2">
        <article className="rounded-2xl border border-line bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Tipos de mensagem</h2>
          <p className="mt-1 text-sm text-muted">Últimos 30 dias</p>
          <MessageTypesChart data={data.message_types || []} />
        </article>

        <article className="rounded-2xl border border-line bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <h2 className="font-semibold">Conversas mais ativas</h2>
              <p className="mt-1 text-sm text-muted">Mais mensagens nos últimos 30 dias</p>
            </div>
            <Link href="/conversations" className="text-sm font-semibold text-brand hover:underline">Ver todas</Link>
          </div>
          {(data.top_conversations || []).length ? (
            <ul className="space-y-2">
              {data.top_conversations.map((item, index) => {
                const max = data.top_conversations[0]?.message_count || 1;
                const width = Math.max(8, Math.round((item.message_count / max) * 100));
                return (
                  <li key={item.id}>
                    <Link href={`/conversations/${encodeURIComponent(item.id)}`} className="focus-ring block rounded-xl px-3 py-2.5 hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <span className="grid size-7 place-items-center rounded-lg bg-brand-soft text-xs font-bold text-brand">{index + 1}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-semibold">{item.title || "Conversa sem título"}</p>
                            <span className="shrink-0 text-xs font-semibold text-muted">{item.message_count.toLocaleString("pt-BR")}</span>
                          </div>
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-brand" style={{ width: `${width}%` }} />
                          </div>
                          <p className="mt-1 text-[11px] text-muted">{item.type === "group" ? "Grupo" : item.type === "direct" ? "Direta" : item.type}</p>
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="py-10 text-center text-sm text-muted">Sem atividade no período.</p>
          )}
        </article>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
        <article className="rounded-2xl border border-line bg-white p-6">
          <div className="flex items-center gap-2">
            <Activity size={19} className="text-brand" />
            <h2 className="font-semibold">Pulso da operação</h2>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            <Info label="Última mensagem" value={formatDate(data.last_message_at)} />
            <Info label="Último webhook" value={formatDate(data.last_webhook_at)} />
            <Info label="Versão" value={data.version ? `v${data.version}` : "—"} />
          </div>
        </article>
        <Link href="/whatsapp" className="rounded-2xl bg-[#153c31] p-6 text-white transition hover:brightness-110">
          <PlugZap className="text-emerald-300" />
          <h2 className="mt-8 text-lg font-semibold">Integração WhatsApp</h2>
          <p className="mt-2 text-sm leading-6 text-white/65">Confira conexão, login e configuração do webhook.</p>
          <span className="mt-5 inline-block text-sm font-semibold text-emerald-300">Ver integração →</span>
        </Link>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  href,
  icon: Icon,
}: {
  label: string;
  value: number;
  hint: string;
  href: string;
  icon: typeof MessageCircle;
}) {
  return (
    <Link href={href} className="group rounded-2xl border border-line bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand"><Icon size={20} /></span>
      <p className="mt-5 text-3xl font-semibold tracking-tight">{(value || 0).toLocaleString("pt-BR")}</p>
      <p className="mt-1 text-sm font-medium">{label}</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </Link>
  );
}

function MiniStat({
  label,
  value,
  href,
  icon: Icon,
}: {
  label: string;
  value: number;
  href: string;
  icon: typeof MessageCircle;
}) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3 transition hover:bg-slate-50">
      <span className="grid size-9 place-items-center rounded-xl bg-slate-100 text-slate-600"><Icon size={16} /></span>
      <div>
        <p className="text-lg font-semibold tracking-tight">{(value || 0).toLocaleString("pt-BR")}</p>
        <p className="text-xs text-muted">{label}</p>
      </div>
    </Link>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l-2 border-brand-soft pl-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-2 text-sm font-medium">{value}</p>
    </div>
  );
}
