import type { Metadata } from "next";
import { SectionTabs } from "@/components/section-tabs";
import { integracoesTabs } from "@/components/section-tab-items";
import { PushoverForms } from "@/components/pushover-forms";
import { Badge, PageHeader } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import type { PushoverIntegration, PushoverSound } from "@/lib/types";

export const metadata: Metadata = { title: "Pushover" };

export default async function PushoverPage() {
  const integration = await apiFetch<PushoverIntegration>("/api/v1/integrations/pushover");
  // A sound listing failure must not block the page; the default tone stays selectable.
  const sounds = integration.configured
    ? await apiFetch<{ sounds: PushoverSound[] }>("/api/v1/integrations/pushover/sounds").then((response) => response.sounds).catch(() => [])
    : [];
  const tone = integration.configured && integration.enabled ? "success" : integration.configured ? "warning" : "neutral";
  const label = integration.configured && integration.enabled ? "Ativa" : integration.configured ? "Desativada" : "Não configurada";
  return <div className="mx-auto max-w-5xl p-5 md:p-9 lg:p-12">
    <PageHeader eyebrow="Integrações" title="Pushover" description="Configure o destino e envie notificações imediatas pela web ou pelo MCP." action={<Badge tone={tone}>{label}</Badge>} />
    <SectionTabs items={integracoesTabs} />
    <PushoverForms integration={integration} sounds={sounds} />
  </div>;
}
