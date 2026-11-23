import type { Metadata } from "next";
import { Bot, KeyRound, Wrench } from "lucide-react";
import { McpKeys } from "@/components/mcp-keys";
import { SectionTabs } from "@/components/section-tabs";
import { integracoesTabs } from "@/components/section-tab-items";
import { Badge, EmptyState, PageHeader } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { McpKey, McpStatus } from "@/lib/types";

export const metadata: Metadata = { title: "MCP" };

export default async function McpPage() {
  const [data, keys] = await Promise.all([
    apiFetch<McpStatus>("/api/v1/mcp/status"),
    apiFetch<{ data: McpKey[] }>("/api/v1/mcp/keys"),
  ]);
  const tools = data.tools ?? [];
  return (
    <div className="mx-auto max-w-5xl p-5 md:p-9 lg:p-12">
      <PageHeader
        eyebrow="Integrações"
        title="Servidor MCP"
        description="Chaves de acesso e ferramentas expostas para agentes autorizados."
        action={<Badge tone={data.enabled ? "success" : "neutral"}>{data.enabled ? "Habilitado" : "Desabilitado"}</Badge>}
      />
      <SectionTabs items={integracoesTabs} />
      <section className="rounded-2xl border border-line bg-white p-6">
        <div className="grid gap-6 md:grid-cols-3">
          <Info icon={<Bot />} label="Endpoint" value={data.endpoint} />
          <Info icon={<KeyRound />} label="Autenticação" value={data.authentication} />
          <Info icon={<Wrench />} label="Último acesso" value={formatDate(data.last_access_at)} />
        </div>
      </section>
      {data.enabled ? <McpKeys keys={keys.data} tools={tools} /> : null}
      <h2 className="mb-3 mt-7 font-semibold">Ferramentas disponíveis</h2>
      {tools.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {tools.map((tool) => (
            <div key={tool.name} title={tool.description} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-white px-4 py-3">
              <span className="truncate font-mono text-sm text-ink">{tool.name}</span>
              <Badge tone={tool.read_only ? "success" : "warning"}>{tool.read_only ? "Leitura" : "Escrita"}</Badge>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="Nenhuma ferramenta disponível" description="O servidor ainda não publicou ferramentas MCP." />
      )}
    </div>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="min-w-0">
      <span className="text-brand">{icon}</span>
      <p className="mt-4 text-xs font-bold uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 truncate text-sm font-medium" title={value}>{value}</p>
    </div>
  );
}
