import type { Metadata } from "next";
import { SectionTabs, sistemaTabs } from "@/components/section-tabs";
import { Badge, EmptyState, PageHeader } from "@/components/ui";
import { FilterBar, SelectFilter } from "@/components/filter-bar";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Activity, Paginated } from "@/lib/types";

export const metadata: Metadata = { title: "Atividade" };

export default async function LogsPage({ searchParams }: { searchParams: Promise<{ category?: string; level?: string; from?: string; to?: string; cursor?: string }> }) {
  const filters = await searchParams;
  const result = await apiFetch<Paginated<Activity>>("/api/v1/activity", {
    query: { category: filters.category, level: filters.level, from: filters.from, to: filters.to, cursor: filters.cursor, limit: 50 },
  });
  return (
    <div className="mx-auto max-w-6xl p-5 md:p-9 lg:p-12">
      <PageHeader eyebrow="Sistema" title="Atividade" description="Eventos recentes da aplicação e das integrações." />
      <SectionTabs items={[...sistemaTabs]} />
      <FilterBar showSearch={false}>
        <SelectFilter name="category" label="Categoria" value={filters.category} options={[["", "Todas as categorias"], ["webhook", "Webhook"], ["uazapi", "UAZAPI"], ["mcp", "MCP"], ["admin", "Admin"]]} />
        <SelectFilter name="level" label="Nível" value={filters.level} options={[["", "Todos os níveis"], ["info", "Informação"], ["warning", "Alerta"], ["error", "Erro"]]} />
        <input aria-label="Data inicial" type="date" name="from" defaultValue={filters.from} className="focus-ring h-10 rounded-xl bg-slate-50 px-3 text-sm" />
        <input aria-label="Data final" type="date" name="to" defaultValue={filters.to} className="focus-ring h-10 rounded-xl bg-slate-50 px-3 text-sm" />
      </FilterBar>
      {result.data.length ? (
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Horário</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Operação</th>
                <th className="px-4 py-3">Resultado</th>
                <th className="px-4 py-3">Nível</th>
              </tr>
            </thead>
            <tbody>
              {result.data.map((item) => (
                <tr key={item.id} className="border-t border-line">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-muted">{formatDate(item.occurred_at)}</td>
                  <td className="px-4 py-3 font-medium">{item.category}</td>
                  <td className="px-4 py-3">{item.operation}</td>
                  <td className="px-4 py-3">{item.outcome}</td>
                  <td className="px-4 py-3"><Badge tone={item.level === "error" ? "danger" : item.level === "warning" ? "warning" : "neutral"}>{item.level}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="Nenhuma atividade encontrada" description="Não há eventos que correspondam aos filtros atuais." />
      )}
      {result.next_cursor && (
        <a href={`?${new URLSearchParams({ ...filters, cursor: result.next_cursor }).toString()}`} className="focus-ring mt-5 inline-flex rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold">
          Próxima página
        </a>
      )}
    </div>
  );
}
