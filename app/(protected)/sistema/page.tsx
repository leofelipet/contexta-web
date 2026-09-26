import type { Metadata } from "next";
import Link from "next/link";
import { Activity, Database, Gauge, HardDrive, Layers3, PlugZap, Server, ShieldCheck, CircleAlert } from "lucide-react";
import { SectionTabs, sistemaTabs } from "@/components/section-tabs";
import { Badge, PageHeader } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { formatBytes, formatDate, formatUptime } from "@/lib/format";
import type { SystemOverview } from "@/lib/types";

export const metadata: Metadata = { title: "Sistema" };

export default async function SistemaPage() {
  const data = await apiFetch<SystemOverview>("/api/v1/system");
  const poolMax = data.pool.max_connections || 0;
  const poolUsage = poolMax ? Math.round((data.pool.acquired_connections / poolMax) * 100) : 0;
  const ingestionDelay = data.database.last_message_at
    ? new Date(data.generated_at).valueOf() - new Date(data.database.last_message_at).valueOf()
    : null;
  const ingestionStatus = ingestionDelay === null ? "Sem dados" : ingestionDelay < 15 * 60_000 ? "Ativa" : "Ociosa";
  const attention = poolUsage > 80 || ingestionStatus === "Ociosa" || data.queues.transcription_failed > 0;
  const number = new Intl.NumberFormat("pt-BR");

  return <div className="mx-auto max-w-7xl p-5 md:p-9 lg:p-12">
    <PageHeader
      eyebrow="Sistema"
      title="Saúde"
      description="Saúde da API, ingestão e armazenamento em um só lugar."
      action={<Badge tone={attention ? "warning" : "success"}>{attention ? "Atenção" : "Operacional"}</Badge>}
    />
    <SectionTabs items={[...sistemaTabs]} />

    <section className={`mb-6 flex items-start gap-3 rounded-2xl border px-4 py-4 ${attention ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}>
      <span className={attention ? "text-amber-700" : "text-emerald-700"}>{attention ? <CircleAlert size={20} /> : <ShieldCheck size={20} />}</span>
      <div>
        <p className={`text-sm font-semibold ${attention ? "text-amber-900" : "text-emerald-900"}`}>
          {attention ? "Alguns sinais pedem atenção" : "Componentes operacionais respondendo"}
        </p>
        <p className={`mt-1 text-xs ${attention ? "text-amber-800" : "text-emerald-800"}`}>
          Verificado em {formatDate(data.generated_at)} · uptime {formatUptime(data.started_at)} · v{data.version}
        </p>
      </div>
    </section>

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric icon={HardDrive} label="Banco de dados" value={formatBytes(data.database.size_bytes)} note="armazenamento utilizado" />
      <Metric icon={Activity} label="Mensagens em 24h" value={number.format(data.database.messages_last_24h)} note={data.database.last_message_at ? `última ${formatDate(data.database.last_message_at)}` : "nenhuma mensagem recente"} />
      <Metric icon={Gauge} label="Conexões em uso" value={`${data.pool.acquired_connections}/${data.pool.max_connections}`} note={`${poolUsage}% da capacidade`} />
      <Metric icon={Layers3} label="Schema" value={data.database.migration_version == null ? "—" : `v${data.database.migration_version}`} note="migration aplicada" />
    </section>

    <section className="mt-6 grid gap-5 lg:grid-cols-2">
      <article className="rounded-2xl border border-line bg-white p-6">
        <div className="flex items-center justify-between gap-3">
          <div><h2 className="font-semibold">Estado operacional</h2><p className="mt-1 text-sm text-muted">Sinais observados nesta instância</p></div>
          <Server size={19} className="text-brand" />
        </div>
        <dl className="mt-6 space-y-4">
          <Row label="API administrativa" value="Respondendo" />
          <Row label="PostgreSQL" value="Conectado" />
          <Row label="Ingestão" value={ingestionStatus} />
          <Row label="Última mensagem" value={formatDate(data.database.last_message_at)} />
          <Row label="Último webhook" value={formatDate(data.database.last_webhook_at)} />
          <Row label="Deny list" value={number.format(data.database.denylist_entries)} />
        </dl>
      </article>

      <article className="rounded-2xl border border-line bg-white p-6">
        <div className="flex items-center justify-between gap-3">
          <div><h2 className="font-semibold">Pool de conexões</h2><p className="mt-1 text-sm text-muted">Capacidade do processo atual</p></div>
          <Database size={19} className="text-brand" />
        </div>
        <p className="mt-6 text-4xl font-semibold tracking-tight">{poolUsage}%</p>
        <p className="mt-1 text-sm text-muted">em uso</p>
        <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-line pt-5 text-sm">
          <div><dt className="text-muted">Totais</dt><dd className="mt-1 font-semibold">{data.pool.total_connections}</dd></div>
          <div><dt className="text-muted">Ociosas</dt><dd className="mt-1 font-semibold">{data.pool.idle_connections}</dd></div>
          <div><dt className="text-muted">Adquiridas</dt><dd className="mt-1 font-semibold">{data.pool.acquired_connections}</dd></div>
        </dl>
      </article>
    </section>

    <section className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
      <article className="rounded-2xl border border-line bg-white p-6">
        <div className="flex items-center gap-2"><Activity size={19} className="text-brand" /><h2 className="font-semibold">Filas de transcrição</h2></div>
        <dl className="mt-6 grid gap-4 sm:grid-cols-4">
          <QueueStat label="Pendentes" value={data.queues.transcription_pending} />
          <QueueStat label="Processando" value={data.queues.transcription_processing} />
          <QueueStat label="Retry" value={data.queues.transcription_retry} />
          <QueueStat label="Falhas" value={data.queues.transcription_failed} tone={data.queues.transcription_failed > 0 ? "danger" : undefined} />
        </dl>
      </article>

      <article className="rounded-2xl border border-line bg-white p-6">
        <h2 className="font-semibold">Atalhos</h2>
        <p className="mt-1 text-sm text-muted">Áreas relacionadas</p>
        <div className="mt-5 space-y-2">
          <Shortcut href="/dashboard" icon={Activity} label="Visão geral" />
          <Shortcut href="/limpeza" icon={HardDrive} label="Limpeza de conversas" />
          <Shortcut href="/whatsapp" icon={PlugZap} label="Integrações" />
          <Shortcut href="/logs" icon={Activity} label="Atividade" />
        </div>
      </article>
    </section>
  </div>;
}

function Metric({ icon: Icon, label, value, note }: { icon: typeof Database; label: string; value: string; note: string }) {
  return <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
    <span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand"><Icon size={20} /></span>
    <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
    <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
    <p className="mt-1 text-xs text-muted">{note}</p>
  </div>;
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4 border-b border-line pb-3 last:border-0 last:pb-0">
    <dt className="text-sm text-muted">{label}</dt>
    <dd className="text-sm font-medium">{value}</dd>
  </div>;
}

function QueueStat({ label, value, tone }: { label: string; value: number; tone?: "danger" }) {
  return <div className="rounded-xl bg-slate-50 p-4">
    <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
    <p className={`mt-2 text-2xl font-semibold ${tone === "danger" ? "text-red-700" : ""}`}>{value.toLocaleString("pt-BR")}</p>
  </div>;
}

function Shortcut({ href, icon: Icon, label }: { href: string; icon: typeof Activity; label: string }) {
  return <Link href={href} className="focus-ring flex items-center gap-3 rounded-xl border border-line px-3 py-2.5 text-sm font-medium hover:bg-slate-50">
    <Icon size={16} className="text-brand" />{label}<span className="ml-auto text-muted">→</span>
  </Link>;
}
