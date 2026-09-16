import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Phone } from "lucide-react";
import { FilterBar } from "@/components/filter-bar";
import { Avatar, EmptyState, PageHeader } from "@/components/ui";
import { apiFetch, itemsFrom } from "@/lib/api";
import { contactName, formatDate } from "@/lib/format";
import type { Contact, Paginated } from "@/lib/types";

export const metadata: Metadata = { title: "Contatos" };
export default async function ContactsPage({ searchParams }: { searchParams: Promise<{ q?: string; cursor?: string }> }) {
  const { q, cursor } = await searchParams;
  const payload = await apiFetch<Contact[] | Paginated<Contact>>("/api/v1/contacts", { query: { query: q, cursor, limit: 100 } });
  const contacts = itemsFrom(payload);
  return <div className="mx-auto max-w-5xl p-5 md:p-9 lg:p-12"><PageHeader eyebrow="Pessoas" title="Contatos" description="Perfis identificados nas conversas recebidas e enviadas." /><FilterBar defaultValue={q} placeholder="Nome ou telefone" />
    {contacts.length ? <div className="overflow-hidden rounded-2xl border border-line bg-white">{contacts.map((contact) => { const name = contactName(contact); return <Link key={contact.id} href={`/contacts/${encodeURIComponent(contact.id)}`} className="focus-ring flex items-center gap-4 border-b border-line p-4 transition last:border-0 hover:bg-slate-50"><Avatar name={name} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{name}</p><p className="mt-1 flex items-center gap-1.5 text-xs text-muted"><Phone size={12} />{contact.phone || "Telefone não informado"}</p></div><p className="hidden text-xs text-muted sm:block">Atualizado {formatDate(contact.updated_at)}</p><ChevronRight size={18} className="text-slate-400" /></Link>; })}</div> : <EmptyState title="Nenhum contato encontrado" description="Ajuste a busca ou aguarde a chegada de novas conversas." />}
    {!Array.isArray(payload) && payload.next_cursor && <Link href={`?${new URLSearchParams({ ...(q ? { q } : {}), cursor: payload.next_cursor }).toString()}`} className="focus-ring mt-5 inline-flex rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold">Próxima página</Link>}
  </div>;
}
