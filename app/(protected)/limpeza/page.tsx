import type { Metadata } from "next";
import { Check, HardDrive } from "lucide-react";
import { LimpezaList } from "@/components/limpeza-list";
import { SectionTabs } from "@/components/section-tabs";
import { manutencaoTabs } from "@/components/section-tab-items";
import { Badge, PageHeader } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import type { StaleConversationsResponse } from "@/lib/types";

export const metadata: Metadata = { title: "Limpeza" };

export default async function LimpezaPage({ searchParams }: { searchParams: Promise<{ days?: string; cursor?: string; deleted?: string }> }) {
  const query = await searchParams;
  const days = Number(query.days) > 0 ? Number(query.days) : 30;
  const payload = await apiFetch<StaleConversationsResponse>("/api/v1/conversations/stale", {
    query: { days, cursor: query.cursor, limit: 50 },
  });
  const conversations = payload.data || [];
  const totalMessages = conversations.reduce((sum, item) => sum + (item.message_count || 0), 0);
  const deletedCount = Number(query.deleted) > 0 ? Number(query.deleted) : 0;

  return <div className="mx-auto max-w-5xl p-5 md:p-9 lg:p-12">
    <PageHeader
      eyebrow="Manutenção"
      title="Limpeza"
      description="Conversas bloqueadas e conversas sem atividade recente para liberar espaço no banco. O padrão de inatividade é 30 dias."
      action={<Badge tone={conversations.length ? "warning" : "success"}>{conversations.length ? `${conversations.length} candidatas` : "Nada pendente"}</Badge>}
    />
    <SectionTabs items={manutencaoTabs} />

    {deletedCount > 0 && (
      <p className="mb-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
        <Check size={17} />
        {deletedCount === 1 ? "Conversa apagada com sucesso." : `${deletedCount.toLocaleString("pt-BR")} conversas apagadas com sucesso.`}
      </p>
    )}

    <section className="mb-6 rounded-2xl border border-line bg-white p-6">
      <div className="flex items-center gap-2"><HardDrive size={18} className="text-brand" /><h2 className="font-semibold">Filtro de inatividade</h2></div>
      <p className="mt-2 text-sm text-muted">Conversas bloqueadas aparecem sempre no topo. As demais entram quando a última mensagem (ou criação, se vazia) é mais antiga que o período escolhido. Selecione várias para apagar em massa.</p>
      <form className="mt-5 flex flex-wrap items-end gap-3">
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Dias sem mensagem</span>
          <input type="number" name="days" min={1} max={3650} defaultValue={days} className="focus-ring w-32 rounded-xl border border-line px-3 py-2.5 text-sm" />
        </label>
        <button className="focus-ring rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">Atualizar lista</button>
      </form>
      {conversations.length > 0 && (
        <p className="mt-4 text-xs text-muted">
          Nesta página: {conversations.length.toLocaleString("pt-BR")} conversas · {totalMessages.toLocaleString("pt-BR")} mensagens acumuladas
        </p>
      )}
    </section>

    <LimpezaList conversations={conversations} days={days} nextCursor={payload.next_cursor} />
  </div>;
}
