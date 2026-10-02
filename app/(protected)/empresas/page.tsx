import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Check } from "lucide-react";
import { bulkDeleteCompanies } from "@/app/actions";
import { type BulkAction, BulkActionBar, BulkCheckbox, BulkSelectAll, BulkSelectionProvider } from "@/components/bulk-selection";
import { CompanyCreate } from "@/components/company-form";
import { LiveSearchInput } from "@/components/live-filters";
import { EmptyState, PageHeader } from "@/components/ui";
import { apiFetch, itemsFrom } from "@/lib/api";
import type { Company, Paginated } from "@/lib/types";

export const metadata: Metadata = { title: "Empresas" };

const companyNoun = ["empresa", "empresas"] as const;

const bulkActions: BulkAction[] = [
  {
    label: "Apagar",
    icon: "trash",
    tone: "danger",
    run: bulkDeleteCompanies,
    done: ["empresa apagada", "empresas apagadas"],
    confirm: {
      title: "Apagar {n}?",
      description: "Essa ação apaga {n} de forma permanente. Tarefas, recorrências e contatos vinculados são mantidos, sem empresa.",
      confirmLabel: "Apagar",
    },
  },
];

function plural(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`;
}

export default async function EmpresasPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string; cursor?: string; q?: string }>;
}) {
  const query = await searchParams;
  const payload = await apiFetch<Company[] | Paginated<Company>>("/api/v1/companies", {
    query: { limit: 50, cursor: query.cursor, q: query.q || undefined },
  });
  const companyList = itemsFrom(payload);

  return (
    <div className="mx-auto max-w-5xl p-5 md:p-9 lg:p-12">
      <PageHeader
        eyebrow="Organização"
        title="Empresas"
        description="Agrupe tarefas, recorrências e contatos por empresa para identificar rapidamente de quem é cada demanda. Também disponíveis via MCP."
      />
      {query.deleted === "1" && (
        <p className="mb-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <Check size={17} />Empresa apagada. Tarefas e contatos vinculados foram mantidos, sem empresa.
        </p>
      )}

      <CompanyCreate />

      <div className="mb-6 rounded-2xl border border-line bg-white p-4">
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Busca</span>
          <LiveSearchInput
            name="q"
            defaultValue={query.q || ""}
            placeholder="Nome, observações ou #ID"
            className="focus-ring h-10 w-full rounded-xl border border-line bg-white pl-10 pr-3 text-sm"
          />
        </label>
      </div>

      {companyList.length ? (
        <BulkSelectionProvider ids={companyList.map((company) => company.id)}>
          <div className="overflow-hidden rounded-2xl border border-line bg-white">
            <BulkSelectAll noun={companyNoun} />
            {companyList.map((company) => (
              <div key={company.id} className="flex items-center gap-3 border-b border-line pl-4 pr-3 transition last:border-0 hover:bg-slate-50 has-[[data-bulk]:checked]:bg-brand-soft/60">
                <BulkCheckbox id={company.id} label={company.name} />
                <Link
                  href={`/empresas/${encodeURIComponent(company.id)}`}
                  className="focus-ring flex min-w-0 flex-1 flex-wrap items-center gap-4 rounded-lg py-4 pr-1"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                    <Building2 size={18} />
                  </span>
                  <div className="min-w-40 flex-1">
                    <p className="truncate text-sm font-semibold">{company.name}</p>
                    {company.notes ? <p className="mt-1 truncate text-xs text-muted">{company.notes}</p> : null}
                  </div>
                  <div className="text-xs text-muted sm:text-right">
                    <p>{plural(company.open_task_count, "tarefa aberta", "tarefas abertas")} · {company.task_count} no total</p>
                    <p className="mt-1">{plural(company.contact_count, "contato", "contatos")}</p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
          <BulkActionBar noun={companyNoun} actions={bulkActions} />
        </BulkSelectionProvider>
      ) : (
        <EmptyState title="Nenhuma empresa" description="Crie uma empresa acima ou ajuste a busca." />
      )}

      {!Array.isArray(payload) && payload.next_cursor && (
        <Link
          href={`?${new URLSearchParams({ ...(query.q ? { q: query.q } : {}), cursor: payload.next_cursor }).toString()}`}
          className="focus-ring mt-5 inline-flex rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold"
        >
          Próxima página
        </Link>
      )}
    </div>
  );
}
