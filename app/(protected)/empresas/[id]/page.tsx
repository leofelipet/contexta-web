import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Check, Repeat } from "lucide-react";
import { notFound } from "next/navigation";
import { CompanyForm } from "@/components/company-form";
import { CompanyContactsSection, CompanyTasksSection } from "@/components/company-links";
import { TaskCreateForm } from "@/components/task-create-form";
import { Badge, PageHeader } from "@/components/ui";
import { apiFetch, itemsFrom } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { describeCron } from "@/lib/schedule-form";
import type { Company, Contact, Conversation, Paginated, Task, TaskSchedule } from "@/lib/types";

export const metadata: Metadata = { title: "Empresa" };

export default async function EmpresaDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; updated?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;

  let company: Company;
  try {
    company = await apiFetch<Company>(`/api/v1/companies/${encodeURIComponent(id)}`);
  } catch {
    notFound();
  }

  const [tasksPayload, openTasksPayload, linkedContactsPayload, contactsPayload, conversationsPayload, companiesPayload, schedulesPayload] = await Promise.all([
    apiFetch<Task[] | Paginated<Task>>("/api/v1/tasks", { query: { company_id: company.id, limit: 100 } }),
    apiFetch<Task[] | Paginated<Task>>("/api/v1/tasks", { query: { open_only: "1", limit: 200 } }),
    apiFetch<Contact[] | Paginated<Contact>>("/api/v1/contacts", { query: { company_id: company.id, limit: 200 } }),
    apiFetch<Contact[] | Paginated<Contact>>("/api/v1/contacts", { query: { limit: 200 } }),
    apiFetch<Conversation[] | Paginated<Conversation>>("/api/v1/conversations", { query: { limit: 200 } }),
    apiFetch<Company[] | Paginated<Company>>("/api/v1/companies", { query: { limit: 200 } }),
    apiFetch<TaskSchedule[] | Paginated<TaskSchedule>>("/api/v1/task-schedules", { query: { company_id: company.id, limit: 50 } }),
  ]);
  const contacts = itemsFrom(contactsPayload);
  const scheduleList = itemsFrom(schedulesPayload);

  return (
    <div className="mx-auto max-w-3xl p-5 md:p-9 lg:p-12">
      <Link href="/empresas" className="focus-ring mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft size={16} />Voltar às empresas
      </Link>
      <PageHeader
        eyebrow="Empresa"
        title={company.name}
        description={`${company.open_task_count} ${company.open_task_count === 1 ? "tarefa aberta" : "tarefas abertas"} · cadastrada em ${formatDate(company.created_at)}`}
      />
      {query.created === "1" && (
        <p className="mb-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <Check size={17} />Empresa criada.
        </p>
      )}
      {query.updated === "1" && (
        <p className="mb-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <Check size={17} />Empresa atualizada.
        </p>
      )}

      <div className="rounded-2xl border border-line bg-white p-6">
        <CompanyForm company={company} />
      </div>

      <div className="mt-6">
        <TaskCreateForm
          conversations={itemsFrom(conversationsPayload)}
          contacts={contacts}
          companies={itemsFrom(companiesPayload)}
          defaultCompanyId={company.id}
          returnTo={`/empresas/${company.id}`}
        />
      </div>
      <CompanyTasksSection companyId={company.id} linked={itemsFrom(tasksPayload)} candidates={itemsFrom(openTasksPayload)} />
      <CompanyContactsSection companyId={company.id} linked={itemsFrom(linkedContactsPayload)} candidates={contacts} />

      {scheduleList.length ? (
        <section className="mt-6 rounded-2xl border border-line bg-white p-6">
          <h2 className="font-semibold">Recorrências</h2>
          <ul className="mt-4 divide-y divide-line rounded-xl border border-line">
            {scheduleList.map((schedule) => (
              <li key={schedule.id}>
                <Link href={`/recorrentes/${encodeURIComponent(schedule.id)}`} className="flex flex-wrap items-center gap-3 p-3 hover:bg-slate-50">
                  <Repeat size={16} className="text-brand" />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">#{schedule.id} - {schedule.title}</span>
                  <span className="text-xs text-muted">{describeCron(schedule.cron)}</span>
                  <Badge tone={schedule.enabled ? "success" : "neutral"}>{schedule.enabled ? "Ativa" : "Pausada"}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
