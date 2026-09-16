"use client";

import { useActionState } from "react";
import { LoaderCircle, LockKeyhole } from "lucide-react";
import { login, type LoginState } from "@/app/actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(login, initialState);
  return <form action={action} className="mt-8 space-y-4">
    <div><label htmlFor="password" className="mb-2 block text-sm font-semibold">Senha administrativa</label><div className="relative"><LockKeyhole className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={18} /><input id="password" name="password" type="password" autoComplete="current-password" maxLength={256} required autoFocus className="focus-ring h-12 w-full rounded-xl border border-line bg-white pl-11 pr-4 text-sm shadow-sm placeholder:text-slate-400" placeholder="Digite sua senha" /></div></div>
    {state.error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">{state.error}</p>}
    <button disabled={pending} className="focus-ring flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-60">{pending && <LoaderCircle className="animate-spin" size={18} />}{pending ? "Entrando..." : "Entrar"}</button>
  </form>;
}
