import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { notFound } from "next/navigation";
import { EmailAccountForm } from "@/components/email-account-form";
import { EmailTestButton } from "@/components/email-test-button";
import { Badge, PageHeader } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { EmailAccount } from "@/lib/types";

export const metadata: Metadata = { title: "Conta de e-mail" };

export default async function EmailAccountPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; updated?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;

  let account: EmailAccount;
  try {
    account = await apiFetch<EmailAccount>(`/api/v1/email-accounts/${encodeURIComponent(id)}`);
  } catch {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl p-5 md:p-9 lg:p-12">
      <Link href="/email" className="focus-ring mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft size={16} />Voltar às contas de e-mail
      </Link>
      <PageHeader
        eyebrow="Conta de e-mail"
        title={account.name}
        description={`${account.address} · criada em ${formatDate(account.created_at)} · atualizada em ${formatDate(account.updated_at)}`}
        action={<Badge tone={account.enabled ? "success" : "neutral"}>{account.enabled ? "Ativa" : "Desativada"}</Badge>}
      />
      {query.created === "1" && (
        <p className="mb-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <Check size={17} />Conta cadastrada. Teste a conexão para confirmar as credenciais.
        </p>
      )}
      {query.updated === "1" && (
        <p className="mb-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <Check size={17} />Conta atualizada.
        </p>
      )}
      <section className="mb-6 rounded-2xl border border-line bg-white p-6">
        <h2 className="mb-1 font-semibold">Conexão</h2>
        <p className="mb-4 text-sm text-muted">Faz login no IMAP e no SMTP com as credenciais salvas, sem ler nem enviar e-mails.</p>
        <EmailTestButton accountId={account.id} />
      </section>
      <section className="rounded-2xl border border-line bg-white p-6">
        <h2 className="mb-5 font-semibold">Configuração</h2>
        <EmailAccountForm account={account} />
      </section>
    </div>
  );
}
