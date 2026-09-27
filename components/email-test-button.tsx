"use client";

import { useActionState } from "react";
import { CheckCircle2, LoaderCircle, PlugZap, XCircle } from "lucide-react";
import { testEmailAccount, type EmailTestState } from "@/app/actions";

const initialState: EmailTestState = {};

export function EmailTestButton({ accountId }: { accountId: string }) {
  const [state, action, pending] = useActionState(testEmailAccount, initialState);
  return (
    <div>
      <form action={action}>
        <input type="hidden" name="id" value={accountId} />
        <button disabled={pending} className="focus-ring inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 disabled:opacity-60">
          {pending ? <LoaderCircle className="animate-spin" size={16} /> : <PlugZap size={16} />}
          {pending ? "Testando (até 25s)..." : "Testar conexão"}
        </button>
      </form>
      {state.error ? <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">{state.error}</p> : null}
      {state.result ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <Result label="IMAP (leitura)" ok={state.result.imap_ok} error={state.result.imap_error} />
          <Result label="SMTP (envio)" ok={state.result.smtp_ok} error={state.result.smtp_error} />
        </div>
      ) : null}
    </div>
  );
}

function Result({ label, ok, error }: { label: string; ok: boolean; error?: string }) {
  return (
    <div className={`rounded-xl px-3 py-2.5 text-sm ${ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
      <p className="flex items-center gap-2 font-semibold">
        {ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
        {label}: {ok ? "conectado" : "falhou"}
      </p>
      {error ? <p className="mt-1 break-words font-mono text-xs">{error}</p> : null}
    </div>
  );
}
