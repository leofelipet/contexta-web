import type { Metadata } from "next";
import { PasskeyManager } from "@/components/passkey-manager";
import { SectionTabs } from "@/components/section-tabs";
import { sistemaTabs } from "@/components/section-tab-items";
import { Badge, PageHeader } from "@/components/ui";
import { isPasswordEnabled } from "@/lib/auth-settings";
import { listPasskeys } from "@/lib/passkeys";

export const metadata: Metadata = { title: "Acesso" };
export const dynamic = "force-dynamic";

export default async function AcessoPage() {
  const passwordEnabled = isPasswordEnabled();
  const passkeys = await listPasskeys();

  return (
    <div className="mx-auto max-w-3xl p-5 md:p-9 lg:p-12">
      <PageHeader
        eyebrow="Sistema"
        title="Acesso"
        description="Cadastre passkeys para entrar sem senha. A sessão dura 7 dias."
        action={<Badge tone={passwordEnabled ? "neutral" : "success"}>{passwordEnabled ? "Senha ativa" : "Somente passkey"}</Badge>}
      />
      <SectionTabs items={sistemaTabs} />
      <p className="mb-6 rounded-2xl border border-line bg-white px-4 py-3 text-sm leading-6 text-muted">
        {passwordEnabled
          ? "Depois de cadastrar ao menos uma passkey, você pode desativar a senha com ADMIN_PASSWORD_ENABLED=false."
          : "A senha está desativada neste ambiente. Mantenha ao menos uma passkey cadastrada."}
      </p>
      <PasskeyManager passkeys={passkeys} passwordEnabled={passwordEnabled} />
    </div>
  );
}
