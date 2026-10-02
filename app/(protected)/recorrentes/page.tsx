import type { Metadata } from "next";
import Link from "next/link";
import { Check, Repeat } from "lucide-react";
import { bulkDeleteTaskSchedules, bulkSetTaskSchedulesEnabled } from "@/app/actions";
import { type BulkAction, BulkActionBar, BulkCheckbox, BulkList, BulkSelectAll, BulkSelectionProvider } from "@/components/bulk-selection";
import { LiveSearchInput, LiveSelect } from "@/components/live-filters";
import { SectionTabs } from "@/components/section-tabs";
import { tarefasTabs } from "@/components/section-tab-items";
import { TaskScheduleCreate } from "@/components/task-schedule-form";
import { Badge, EmptyState, PageHeader } from "@/components/ui";
import { apiFetch, itemsFrom } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { describeCron } from "@/lib/schedule-form";
import type { Company, Contact, Conversation, Paginated, TaskSchedule } from "@/lib/types";

export const metadata: Metadata = { title: "Tarefas recorrentes" };

const scheduleNoun = ["recorrência", "recorrências"] as const;

const bulkActions: BulkAction[] = [
  { label: "Pausar", icon: "pause", run: bulkSetTaskSchedulesEnabled.bind(null, false), done: ["recorrência pausada", "recorrências pausadas"] },
  { label: "Ativar", icon: "play", run: bulkSetTaskSchedulesEnabled.bind(null, true), done: ["recorrência ativada", "recorrências ativadas"] },
  {
    label: "Apagar",
    icon: "trash",
    tone: "danger",
    run: bulkDeleteTaskSchedules,
    done: ["recorrência apagada", "recorrências apagadas"],
    confirm: {
      title: "Apagar {n}?",
      description: "Essa ação apaga {n} de forma permanente. As tarefas já criadas são mantidas.",
      confirmLabel: "Apagar",
    },
  },
];

export default async function RecorrentesPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string; cursor?: string; enabled?: string; q?: string }>;
}) {
  const query = await searchParams;
  const enabled = query.enabled === "true" || query.enabled === "false" ? query.enabled : undefined;

  const [payload, conversationsPayload, contactsPayload, companiesPayload] = await Promise.all([
    apiFetch<TaskSchedule[] | Paginated<TaskSchedule>>("/api/v1/task-schedules", {
      query: { limit: 50, cursor: query.cursor, enabled, q: query.q || undefined },
    }),
    apiFetch<Conversation[] | Paginated<Conversation>>("/api/v1/conversations", { query: { limit: 200 } }),
    apiFetch<Contact[] | Paginated<Contact>>("/api/v1/contacts", { query: { limit: 200 } }),
    apiFetch<Company[] | Paginated<Company>>("/api/v1/companies", { query: { limit: 200 } }),
  ]);
  const scheduleList = itemsFrom(payload);

  const filterParams = new URLSearchParams();
  if (enabled) filterParams.set("enabled", enabled);
  if (query.q) filterParams.set("q", query.q);

  return (
    <div className="mx-auto max-w-5xl p-5 md:p-9 lg:p-12">
      <PageHeader
        eyebrow="Organização"
        title="Tarefas recorrentes"
        description="Modelos que criam tarefas automaticamente em uma frequência definida. O agendador verifica de 5 em 5 minutos. Também disponíveis via MCP."
      />
      <SectionTabs items={tarefasTabs} />
      {query.deleted === "1" && (
        <p className="mb-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <Check size={17} />Recorrência apagada. As tarefas já criadas foram mantidas.
        </p>
      )}

      <TaskScheduleCreate conversations={itemsFrom(conversationsPayload)} contacts={itemsFrom(contactsPayload)} companies={itemsFrom(companiesPayload)} />

      <div className="mb-6 grid gap-3 rounded-2xl border border-line bg-white p-4 sm:grid-cols-[1fr_14rem]">
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Busca</span>
          <LiveSearchInput
            name="q"
            defaultValue={query.q || ""}
            placeholder="Título, descrição ou ID"
            className="focus-ring h-10 w-full rounded-xl border border-line bg-white pl-10 pr-3 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Situação</span>
          <LiveSelect
            name="enabled"
            label="Situação"
            value={enabled || ""}
            options={[
              ["", "Todas"],
              ["true", "Ativas"],
              ["false", "Pausadas"],
            ]}
            className="focus-ring h-10 w-full rounded-xl border border-line bg-white px-3 text-sm"
          />
        </label>
      </div>

      {scheduleList.length ? (
        <BulkSelectionProvider ids={scheduleList.map((schedule) => schedule.id)}>
          <BulkList className="overflow-hidden rounded-2xl border border-line bg-white">
            <BulkSelectAll noun={scheduleNoun} />
            {scheduleList.map((schedule) => (
              <div key={schedule.id} data-bulk-row={schedule.id} className="flex items-center gap-3 border-b border-line pl-4 pr-3 transition last:border-0 hover:bg-slate-50 has-[[data-bulk]:checked]:bg-brand-soft/60">
                <BulkCheckbox id={schedule.id} label={`#${schedule.id} - ${schedule.title}`} />
                <Link
                  href={`/recorrentes/${encodeURIComponent(schedule.id)}`}
                  className="focus-ring flex min-w-0 flex-1 flex-wrap items-center gap-4 rounded-lg py-4 pr-1"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                    <Repeat size={18} />
                  </span>
                  <div className="min-w-40 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold">#{schedule.id} - {schedule.title}</p>
                      <Badge tone={schedule.enabled ? "success" : "neutral"}>{schedule.enabled ? "Ativa" : "Pausada"}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {[describeCron(schedule.cron), schedule.company_name].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <div className="text-xs text-muted sm:text-right">
                    <p>{schedule.enabled && schedule.next_run_at ? `Próxima ${formatDate(schedule.next_run_at)}` : "Sem próxima execução"}</p>
                    <p className="mt-1">{schedule.run_count} {schedule.run_count === 1 ? "tarefa criada" : "tarefas criadas"}</p>
                  </div>
                </Link>
              </div>
            ))}
          </BulkList>
          <BulkActionBar noun={scheduleNoun} actions={bulkActions} />
        </BulkSelectionProvider>
      ) : (
        <EmptyState title="Nenhuma recorrência" description="Crie uma recorrência acima ou ajuste os filtros." />
      )}

      {!Array.isArray(payload) && payload.next_cursor && (
        <Link
          href={`?${new URLSearchParams({ ...Object.fromEntries(filterParams), cursor: payload.next_cursor }).toString()}`}
          className="focus-ring mt-5 inline-flex rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold"
        >
          Próxima página
        </Link>
      )}
    </div>
  );
}
