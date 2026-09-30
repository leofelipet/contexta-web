import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Building2, CalendarDays, Check, MessageCircle, Phone } from "lucide-react";
import { setContactCompany } from "@/app/actions";
import { CompanySelect } from "@/components/company-select";
import { Avatar, PageHeader } from "@/components/ui";
import { apiFetch, itemsFrom } from "@/lib/api";
import { contactName, formatDate } from "@/lib/format";
import type { Company, Contact, Paginated } from "@/lib/types";

export const metadata: Metadata = { title: "Detalhes do contato" };
export default async function ContactPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ updated?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const [contact, companiesPayload] = await Promise.all([
    apiFetch<Contact>(`/api/v1/contacts/${encodeURIComponent(id)}`),
    apiFetch<Company[] | Paginated<Company>>("/api/v1/companies", { query: { limit: 200 } }),
  ]);
  const name = contactName(contact);
  const phone = contact.phone || "";
  const title = phone && name === phone ? "Contato sem nome" : name;
  return <div className="mx-auto max-w-4xl p-5 md:p-9 lg:p-12"><Link href="/contacts" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-brand"><ArrowLeft size={16} />Voltar para contatos</Link><PageHeader eyebrow="Contato" title={title} />
    {query.updated === "1" && <p className="mb-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"><Check size={17} />Empresa do contato atualizada.</p>}
    <section className="rounded-3xl border border-line bg-white p-6 md:p-8"><div className="flex flex-col gap-5 sm:flex-row sm:items-center"><Avatar name={title} size="lg" /><div><h2 className="text-xl font-semibold">{title}</h2><p className="mt-1 text-sm text-muted">Perfil de relacionamento</p></div></div><dl className="mt-8 grid gap-4 sm:grid-cols-2"><Detail icon={<Phone />} label="Telefone" value={phone || "Não informado"} /><Detail icon={<CalendarDays />} label="Cadastrado em" value={formatDate(contact.created_at)} /></dl>
      <form action={setContactCompany} className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-[1fr_auto]">
        <input type="hidden" name="contact_id" value={contact.id} />
        <input type="hidden" name="current_company_id" value={contact.company_id || ""} />
        <label className="block text-sm">
          <span className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted"><Building2 size={14} className="text-brand" />Empresa</span>
          <CompanySelect companies={itemsFrom(companiesPayload)} defaultValue={contact.company_id} />
        </label>
        <div className="flex items-end gap-2">
          <button className="focus-ring rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">Salvar</button>
          {contact.company_id && <Link href={`/empresas/${encodeURIComponent(contact.company_id)}`} className="focus-ring rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-100">Ver empresa</Link>}
        </div>
      </form>
      <Link href={`/conversations?contact_id=${encodeURIComponent(contact.id)}`} className="focus-ring mt-7 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white"><MessageCircle size={17} />Ver conversas</Link></section>
  </div>;
}
function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="rounded-xl bg-slate-50 p-4"><span className="text-brand">{icon}</span><dt className="mt-3 text-xs font-bold uppercase tracking-wide text-muted">{label}</dt><dd className="mt-1 text-sm font-medium">{value}</dd></div>; }
