import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CalendarDays, MessageCircle, Phone } from "lucide-react";
import { Avatar, PageHeader } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { contactName, formatDate } from "@/lib/format";
import type { Contact } from "@/lib/types";

export const metadata: Metadata = { title: "Detalhes do contato" };
export default async function ContactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contact = await apiFetch<Contact>(`/api/v1/contacts/${encodeURIComponent(id)}`);
  const name = contactName(contact);
  return <div className="mx-auto max-w-4xl p-5 md:p-9 lg:p-12"><Link href="/contacts" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-brand"><ArrowLeft size={16} />Voltar para contatos</Link><PageHeader eyebrow="Contato" title={name} />
    <section className="rounded-3xl border border-line bg-white p-6 md:p-8"><div className="flex flex-col gap-5 sm:flex-row sm:items-center"><Avatar name={name} size="lg" /><div><h2 className="text-xl font-semibold">{name}</h2><p className="mt-1 text-sm text-muted">Perfil de relacionamento</p></div></div><dl className="mt-8 grid gap-4 sm:grid-cols-2"><Detail icon={<Phone />} label="Telefone" value={contact.phone || "Não informado"} /><Detail icon={<CalendarDays />} label="Cadastrado em" value={formatDate(contact.created_at)} /></dl>
      <Link href={`/conversations?contact_id=${encodeURIComponent(contact.id)}`} className="focus-ring mt-7 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white"><MessageCircle size={17} />Ver conversas</Link></section>
  </div>;
}
function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="rounded-xl bg-slate-50 p-4"><span className="text-brand">{icon}</span><dt className="mt-3 text-xs font-bold uppercase tracking-wide text-muted">{label}</dt><dd className="mt-1 text-sm font-medium">{value}</dd></div>; }
