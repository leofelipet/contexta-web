import type { Metadata } from "next";
import Link from "next/link";
import { Ban, Check, Trash2 } from "lucide-react";
import { addDenylistEntry, removeDenylistEntry } from "@/app/actions";
import { Badge, EmptyState, PageHeader } from "@/components/ui";
import { apiFetch, itemsFrom } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { DenylistEntry, Paginated } from "@/lib/types";

export const metadata: Metadata = { title: "Deny list" };

export default async function DenylistPage({ searchParams }: { searchParams: Promise<{ added?: string; removed?: string; cursor?: string }> }) {
  const query = await searchParams;
  const payload = await apiFetch<DenylistEntry[] | Paginated<DenylistEntry>>("/api/v1/denylist", { query: { cursor: query.cursor, limit: 100 } });
  const entries = itemsFrom(payload);
  return <div className="mx-auto max-w-5xl p-5 md:p-9 lg:p-12">
    <PageHeader eyebrow="Filtros" title="Deny list" description="Bloqueie o salvamento de novas mensagens de grupos ou conversas diretas com contatos específicos." />
    {query.added === "1" && <p className="mb-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"><Check size={17} />Entrada adicionada à deny list.</p>}
    {query.removed === "1" && <p className="mb-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"><Check size={17} />Entrada removida da deny list.</p>}

    <section className="mb-6 rounded-2xl border border-line bg-white p-6">
      <div className="flex items-center gap-2"><Ban size={18} className="text-brand" /><h2 className="font-semibold">Adicionar bloqueio</h2></div>
      <p className="mt-2 text-sm text-muted">Use o UUID da conversa (grupos) ou do contato (só conversa direta). Copie o ID nas páginas de Conversas ou Contatos.</p>
      <form action={addDenylistEntry} className="mt-5 grid gap-4 sm:grid-cols-[160px_1fr_1fr_auto]">
        <label className="block text-sm"><span className="mb-1.5 block font-medium">Tipo</span>
          <select name="target_type" required defaultValue="conversation" className="focus-ring w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm">
            <option value="conversation">Conversa / grupo</option>
            <option value="contact">Contato (direto)</option>
          </select>
        </label>
        <label className="block text-sm sm:col-span-1"><span className="mb-1.5 block font-medium">ID</span>
          <input name="target_id" required placeholder="UUID da conversa ou contato" className="focus-ring w-full rounded-xl border border-line px-3 py-2.5 font-mono text-sm" />
        </label>
        <label className="block text-sm"><span className="mb-1.5 block font-medium">Motivo (opcional)</span>
          <input name="reason" placeholder="Ex.: grupo de spam" className="focus-ring w-full rounded-xl border border-line px-3 py-2.5 text-sm" />
        </label>
        <div className="flex items-end"><button className="focus-ring w-full rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark sm:w-auto">Bloquear</button></div>
      </form>
    </section>

    {entries.length ? <div className="overflow-hidden rounded-2xl border border-line bg-white">
      {entries.map((entry) => (
        <div key={entry.id} className="flex flex-wrap items-center gap-4 border-b border-line p-4 last:border-0">
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
    </div> : <EmptyState title="Nenhum bloqueio ativo" description="Adicione conversas ou contatos para impedir o salvamento de novas mensagens." />}

    {!Array.isArray(payload) && payload.next_cursor && <Link href={`?${new URLSearchParams({ cursor: payload.next_cursor }).toString()}`} className="focus-ring mt-5 inline-flex rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold">Próxima página</Link>}
  </div>;
}
