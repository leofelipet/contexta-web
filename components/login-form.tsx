"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { startAuthentication } from "@simplewebauthn/browser";
import { Fingerprint, LoaderCircle, LockKeyhole } from "lucide-react";
import { login, type LoginState } from "@/app/actions";
import { passkeyUserMessage, readApiError } from "@/lib/passkey-client";

const initialState: LoginState = {};

export function LoginForm({
  passwordEnabled,
  passkeysAvailable,
}: {
  passwordEnabled: boolean;
  passkeysAvailable: boolean;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(login, initialState);
  const [passkeyError, setPasskeyError] = useState<string>();
  const [passkeyPending, setPasskeyPending] = useState(false);

  async function signInWithPasskey() {
    if (passkeyPending || pending) return;
    setPasskeyError(undefined);
    setPasskeyPending(true);
    try {
      const optionsResponse = await fetch("/api/passkeys/login/options", { method: "POST" });
      if (!optionsResponse.ok) {
        setPasskeyError(await readApiError(optionsResponse, "Não foi possível iniciar a passkey."));
        return;
      }
      const assertion = await startAuthentication({ optionsJSON: await optionsResponse.json() });
      const verifyResponse = await fetch("/api/passkeys/login/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assertion),
      });
      if (!verifyResponse.ok) {
        setPasskeyError(await readApiError(verifyResponse, "Não foi possível verificar a passkey."));
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setPasskeyError(passkeyUserMessage(error));
    } finally {
      setPasskeyPending(false);
    }
  }

  if (!passwordEnabled && !passkeysAvailable) {
    return (
      <p role="alert" className="mt-8 rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
        Nenhuma passkey cadastrada e a senha está desativada. Defina <code className="font-mono">ADMIN_PASSWORD_ENABLED=true</code> para recuperar o acesso.
      </p>
    );
  }

  return (
    <div className="mt-8 space-y-4">
      {passwordEnabled ? (
        <form action={action} className="space-y-4">
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-semibold">Senha administrativa</label>
            <div className="relative">
              <LockKeyhole className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={18} />
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                maxLength={256}
                required
                autoFocus
                className="focus-ring h-12 w-full rounded-xl border border-line bg-white pl-11 pr-4 text-sm shadow-sm placeholder:text-slate-400"
                placeholder="Digite sua senha"
              />
            </div>
          </div>
          {state.error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">{state.error}</p>}
          <button
            disabled={pending || passkeyPending}
            className="focus-ring flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-60"
          >
            {pending && <LoaderCircle className="animate-spin" size={18} />}
            {pending ? "Entrando..." : "Entrar"}
          </button>
        </form>
      ) : null}

      {passwordEnabled && passkeysAvailable ? (
        <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
          <span className="h-px flex-1 bg-line" />
          ou
          <span className="h-px flex-1 bg-line" />
        </div>
      ) : null}

      {passkeysAvailable ? (
        <>
          {passkeyError && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">{passkeyError}</p>}
          <button
            type="button"
            disabled={pending || passkeyPending}
            onClick={() => void signInWithPasskey()}
            className={`focus-ring flex h-12 w-full items-center justify-center gap-2 rounded-xl font-semibold shadow-sm transition disabled:opacity-60 ${
              passwordEnabled
                ? "border border-line bg-white text-ink hover:bg-slate-50"
                : "bg-brand text-white hover:bg-brand-dark"
            }`}
          >
            {passkeyPending ? <LoaderCircle className="animate-spin" size={18} /> : <Fingerprint size={18} />}
            {passkeyPending ? "Aguardando passkey..." : "Entrar com passkey"}
          </button>
        </>
      ) : null}
    </div>
  );
}
