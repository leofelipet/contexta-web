"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startRegistration } from "@simplewebauthn/browser";
import { Fingerprint, LoaderCircle, Plus, Trash2 } from "lucide-react";
import { deletePasskey } from "@/app/actions";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { passkeyUserMessage, readApiError } from "@/lib/passkey-client";
import { formatDate } from "@/lib/format";

type Passkey = {
  id: string;
  name: string;
  createdAt: string;
  deviceType?: string;
  backedUp?: boolean;
};

export function PasskeyManager({
  passkeys,
  passwordEnabled,
}: {
  passkeys: Passkey[];
  passwordEnabled: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [pendingDelete, startDelete] = useTransition();
  const [removing, setRemoving] = useState<Passkey | null>(null);
  const lastPasskeyLocked = !passwordEnabled && passkeys.length <= 1;

  async function registerPasskey() {
    if (busy) return;
    setError(undefined);
    setBusy(true);
    try {
      const optionsResponse = await fetch("/api/passkeys/register/options", { method: "POST" });
      if (!optionsResponse.ok) {
        setError(await readApiError(optionsResponse, "Não foi possível iniciar o cadastro."));
        return;
      }
      const attestation = await startRegistration({ optionsJSON: await optionsResponse.json() });
      const verifyResponse = await fetch("/api/passkeys/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: attestation, name }),
      });
      if (!verifyResponse.ok) {
        setError(await readApiError(verifyResponse, "Não foi possível guardar a passkey."));
        return;
      }
      setName("");
      router.refresh();
    } catch (caught) {
      setError(passkeyUserMessage(caught, "Não foi possível cadastrar a passkey. Tente novamente."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-line bg-white p-6">
        <div className="flex items-center gap-2">
          <Fingerprint size={18} className="text-brand" />
          <h2 className="font-semibold">Cadastrar passkey</h2>
        </div>
        <p className="mt-2 text-sm text-muted">
          Use o Face ID, Windows Hello, chave de segurança ou o gerenciador de senhas do dispositivo.
        </p>
        <form
          className="mt-5 flex flex-col gap-3 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            void registerPasskey();
          }}
        >
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={64}
            placeholder="Nome (ex.: iPhone, YubiKey)"
            className="focus-ring h-11 flex-1 rounded-xl border border-line bg-white px-3.5 text-sm"
          />
          <button
            type="submit"
            disabled={busy}
            className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {busy ? <LoaderCircle className="animate-spin" size={16} /> : <Plus size={16} />}
            {busy ? "Aguardando dispositivo..." : "Adicionar passkey"}
          </button>
        </form>
        {error ? <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p> : null}
      </section>

      <section className="rounded-2xl border border-line bg-white p-6">
        <h2 className="font-semibold">Passkeys cadastradas</h2>
        <p className="mt-1 text-sm text-muted">
          {passkeys.length === 0
            ? "Nenhuma passkey ainda. Cadastre uma para entrar sem senha."
            : `${passkeys.length} passkey${passkeys.length === 1 ? "" : "s"} neste painel.`}
        </p>
        {passkeys.length ? (
          <ul className="mt-5 divide-y divide-line">
            {passkeys.map((passkey) => (
              <li key={passkey.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-semibold">{passkey.name}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {passkey.deviceType === "multiDevice" ? "Sincronizável" : "Neste dispositivo"}
                    {passkey.backedUp ? " · com cópia" : ""}
                    {" · "}
                    {formatDate(passkey.createdAt)}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`Remover ${passkey.name}`}
                  disabled={lastPasskeyLocked}
                  title={lastPasskeyLocked ? "Ative a senha para remover a última passkey" : "Remover passkey"}
                  onClick={() => setRemoving(passkey)}
                  className="focus-ring rounded-lg p-2 text-muted hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <ConfirmDialog
        open={!!removing}
        busy={pendingDelete}
        title="Remover passkey?"
        description={removing ? `“${removing.name}” deixará de poder entrar neste painel.` : ""}
        confirmLabel="Remover"
        onCancel={() => { if (!pendingDelete) setRemoving(null); }}
        onConfirm={() => {
          if (!removing) return;
          startDelete(async () => {
            const result = await deletePasskey(removing.id);
            if (result.error) {
              setError(result.error);
              setRemoving(null);
              return;
            }
            setRemoving(null);
            router.refresh();
          });
        }}
      />
    </div>
  );
}
