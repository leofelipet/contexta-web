import type { Metadata } from "next";
import { Check, Radio, Webhook } from "lucide-react";
import { configureWebhook } from "@/app/actions";
import { SectionTabs, integracoesTabs } from "@/components/section-tabs";
import { Badge, PageHeader } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { UazapiIntegration } from "@/lib/types";

export const metadata: Metadata = { title: "WhatsApp" };

export default async function WhatsappPage({ searchParams }: { searchParams: Promise<{ configured?: string }> }) {
  const [data, query] = await Promise.all([apiFetch<UazapiIntegration>("/api/v1/integrations/uazapi"), searchParams]);
  return <div className="mx-auto max-w-5xl p-5 md:p-9 lg:p-12">
    <PageHeader eyebrow="Integrações" title="WhatsApp" description="Estado da instância e entrega de eventos para a Contexta." />
    <SectionTabs items={[...integracoesTabs]} />
    {query.configured === "1" && <p className="mb-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"><Check size={17} />Webhook configurado com sucesso.</p>}
    <section className="grid gap-5 lg:grid-cols-2">
      <div className="rounded-2xl border border-line bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <span className="grid size-11 place-items-center rounded-xl bg-brand-soft text-brand"><Radio /></span>
          <Badge tone={data.connection.connected && data.connection.logged_in ? "success" : "danger"}>{data.connection.connected ? "Conectada" : "Desconectada"}</Badge>
        </div>
        <h2 className="mt-6 text-xl font-semibold">{data.instance.profile_name || data.instance.name || "Instância WhatsApp"}</h2>
        <dl className="mt-5 space-y-3 text-sm">
          <Row label="Estado" value={data.instance.status} />
          <Row label="Sessão" value={data.connection.logged_in ? "Autenticada" : "Não autenticada"} />
          <Row label="Verificado em" value={formatDate(data.checked_at)} />
        </dl>
      </div>
      <div className="rounded-2xl border border-line bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <span className="grid size-11 place-items-center rounded-xl bg-sky-50 text-sky-700"><Webhook /></span>
          <Badge tone={data.webhook.configured && data.webhook.enabled ? "success" : "warning"}>{data.webhook.enabled ? "Ativo" : "Requer atenção"}</Badge>
        </div>
        <h2 className="mt-6 text-xl font-semibold">Webhook de eventos</h2>
        <p className="mt-2 text-sm text-muted">{data.webhook.events.length ? `${data.webhook.events.length} eventos monitorados` : "Nenhum evento informado"}</p>
        <form action={configureWebhook} className="mt-6">
          <button className="focus-ring rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">{data.webhook.configured ? "Reconfigurar webhook" : "Configurar webhook"}</button>
        </form>
      </div>
    </section>
  </div>;
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4 border-b border-line pb-3 last:border-0"><dt className="text-muted">{label}</dt><dd className="font-medium">{value}</dd></div>;
}
