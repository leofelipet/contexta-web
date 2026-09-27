import type { Metadata } from "next";
import Link from "next/link";
import { Check, Mail } from "lucide-react";
import { EmailAccountCreate } from "@/components/email-account-form";
import { SectionTabs } from "@/components/section-tabs";
import { integracoesTabs } from "@/components/section-tab-items";
import { Badge, EmptyState, PageHeader } from "@/components/ui";
import { apiFetch, itemsFrom } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { EmailAccount, Paginated } from "@/lib/types";

export const metadata: Metadata = { title: "E-mail" };

export default async function EmailPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string; cursor?: string }>;
}) {
  const query = await searchParams;
  const payload = await apiFetch<EmailAccount[] | Paginated<EmailAccount>>("/api/v1/email-accounts", {
    query: { limit: 50, cursor: query.cursor },
  });
  const accounts = itemsFrom(payload);

  return (
    <div className="mx-auto max-w-5xl p-5 md:p-9 lg:p-12">
      <PageHeader
        eyebrow="Integrações"
        title="Contas de e-mail"
        description="Caixas IMAP/SMTP que os agentes podem ler, organizar e usar para enviar e-mails via MCP. Os e-mails ficam no servidor; o Contexta guarda só a configuração, com a senha criptografada."
      />
      <SectionTabs items={integracoesTabs} />
      {query.deleted === "1" && (
        <p className="mb-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <Check size={17} />Conta removida.
        </p>
      )}

      <EmailAccountCreate />

      {accounts.length ? (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          {accounts.map((account) => (
            <Link
              key={account.id}
              href={`/email/${encodeURIComponent(account.id)}`}
              className="flex flex-wrap items-center gap-4 border-b border-line p-4 last:border-0 hover:bg-slate-50"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                <Mail size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold">{account.name}</p>
                  <Badge tone={account.enabled ? "success" : "neutral"}>{account.enabled ? "Ativa" : "Desativada"}</Badge>
                </div>
                <p className="mt-1 truncate text-sm text-muted">{account.address}</p>
                <p className="mt-1 truncate font-mono text-xs text-muted">
                  IMAP {account.imap_host}:{account.imap_port} · SMTP {account.smtp_host}:{account.smtp_port}
                </p>
              </div>
              <div className="text-right text-xs text-muted">
                <p>Criada {formatDate(account.created_at, false)}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title="Nenhuma conta de e-mail" description="Cadastre uma conta acima para liberar as ferramentas de e-mail no MCP." />
      )}

      {!Array.isArray(payload) && payload.next_cursor && (
        <Link
          href={`?${new URLSearchParams({ cursor: payload.next_cursor }).toString()}`}
          className="focus-ring mt-5 inline-flex rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold"
        >
          Próxima página
        </Link>
      )}
    </div>
  );
}
