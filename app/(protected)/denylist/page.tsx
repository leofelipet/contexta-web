import type { Metadata } from "next";
import Link from "next/link";
import { Check, Trash2 } from "lucide-react";
import { bulkRemoveDenylistEntries, removeDenylistEntry } from "@/app/actions";
import { type BulkAction, BulkActionBar, BulkCheckbox, BulkSelectAll, BulkSelectionProvider } from "@/components/bulk-selection";
import { DenylistAddForm } from "@/components/denylist-add-form";
import { SectionTabs } from "@/components/section-tabs";
import { manutencaoTabs } from "@/components/section-tab-items";
import { Badge, EmptyState, PageHeader } from "@/components/ui";
import { apiFetch, itemsFrom } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Contact, Conversation, DenylistEntry, Paginated } from "@/lib/types";

export const metadata: Metadata = { title: "Deny list" };

const entryNoun = ["entrada", "entradas"] as const;

const bulkActions: BulkAction[] = [
  {
    label: "Remover",
    icon: "trash",
    tone: "danger",
    run: bulkRemoveDenylistEntries,
    done: ["entrada removida", "entradas removidas"],
    confirm: {
      title: "Remover {n} da deny list?",
      description: "Novas mensagens desses alvos voltam a ser salvas. Mensagens anteriores não são recuperadas.",
      confirmLabel: "Remover",
    },
  },
];

export default async function DenylistPage({ searchParams }: { searchParams: Promise<{ added?: string; removed?: string; cursor?: string }> }) {
  const query = await searchParams;
  const [payload, conversationsPayload, contactsPayload] = await Promise.all([
    apiFetch<DenylistEntry[] | Paginated<DenylistEntry>>("/api/v1/denylist", { query: { cursor: query.cursor, limit: 100 } }),
    apiFetch<Conversation[] | Paginated<Conversation>>("/api/v1/conversations", { query: { limit: 200 } }),
    apiFetch<Contact[] | Paginated<Contact>>("/api/v1/contacts", { query: { limit: 200 } }),
  ]);
  const entries = itemsFrom(payload);
  const conversations = itemsFrom(conversationsPayload);
  const contacts = itemsFrom(contactsPayload);
  const blockedConversationIds = entries.filter((entry) => entry.target_type === "conversation").map((entry) => entry.target_id);
  const blockedContactIds = entries.filter((entry) => entry.target_type === "contact").map((entry) => entry.target_id);

  return <div className="mx-auto max-w-5xl p-5 md:p-9 lg:p-12">
    <PageHeader eyebrow="Manutenção" title="Deny list" description="Bloqueie o salvamento de novas mensagens de grupos ou conversas diretas com contatos específicos." />
    <SectionTabs items={manutencaoTabs} />
    {query.added === "1" && <p className="mb-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"><Check size={17} />Entrada adicionada à deny list.</p>}
    {query.removed === "1" && <p className="mb-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"><Check size={17} />Entrada removida da deny list.</p>}

    <DenylistAddForm
      conversations={conversations}
      contacts={contacts}
      blockedConversationIds={blockedConversationIds}
      blockedContactIds={blockedContactIds}
    />

    {entries.length ? <BulkSelectionProvider ids={entries.map((entry) => entry.id)}>
      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        <BulkSelectAll noun={entryNoun} />
        {entries.map((entry) => (
          <div key={entry.id} className="flex flex-wrap items-center gap-4 border-b border-line p-4 transition last:border-0 has-[[data-bulk]:checked]:bg-brand-soft/60">
            <BulkCheckbox id={entry.id} label={entry.target_label || "Alvo sem nome"} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-semibold">{entry.target_label || "Alvo sem nome"}</p>
                <Badge tone={entry.target_type === "contact" ? "warning" : "neutral"}>{entry.target_type === "contact" ? "Contato" : "Conversa"}</Badge>
              </div>
              <p className="mt-1 font-mono text-xs text-muted">{entry.target_id}</p>
              {entry.reason && <p className="mt-1 text-xs text-muted">{entry.reason}</p>}
            </div>
            <p className="text-xs text-muted">Desde {formatDate(entry.created_at)}</p>
            <form action={removeDenylistEntry}>
              <input type="hidden" name="id" value={entry.id} />
              <button aria-label="Remover da deny list" className="focus-ring rounded-lg p-2 text-muted hover:bg-red-50 hover:text-red-700"><Trash2 size={16} /></button>
            </form>
          </div>
        ))}
      </div>
      <BulkActionBar noun={entryNoun} actions={bulkActions} />
    </BulkSelectionProvider> : <EmptyState title="Nenhum bloqueio ativo" description="Adicione conversas ou contatos para impedir o salvamento de novas mensagens." />}

    {!Array.isArray(payload) && payload.next_cursor && <Link href={`?${new URLSearchParams({ cursor: payload.next_cursor }).toString()}`} className="focus-ring mt-5 inline-flex rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold">Próxima página</Link>}
  </div>;
}
