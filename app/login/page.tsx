import type { Metadata } from "next";
import { MessageCircle, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return <main className="grid min-h-screen lg:grid-cols-[1.05fr_.95fr]">
    <section className="relative hidden overflow-hidden bg-[#12352b] p-12 text-white lg:flex lg:flex-col lg:justify-between">
      <div className="absolute -right-24 -top-24 size-96 rounded-full border border-white/10" /><div className="absolute -bottom-40 left-20 size-[32rem] rounded-full border border-white/10" />
      <div className="relative flex items-center gap-3 text-xl font-bold"><span className="grid size-10 place-items-center rounded-xl bg-[#25b783]"><MessageCircle size={21} fill="currentColor" /></span>contexta.</div>
      <div className="relative max-w-lg"><p className="mb-5 text-xs font-bold uppercase tracking-[.2em] text-emerald-300">Central de relacionamento</p><h1 className="text-5xl font-semibold leading-[1.08] tracking-tight">Conversas organizadas. Contexto preservado.</h1><p className="mt-6 max-w-md text-base leading-7 text-emerald-50/70">Acompanhe contatos, mensagens e integrações em uma operação simples e segura.</p></div>
      <p className="relative text-xs text-white/40">Painel administrativo Contexta</p>
    </section>
    <section className="flex items-center justify-center bg-paper p-6"><div className="w-full max-w-md rounded-3xl border border-line bg-white p-7 shadow-[0_24px_70px_-35px_rgba(15,45,35,.35)] md:p-10">
      <div className="mb-10 flex items-center gap-3 font-bold lg:hidden"><span className="grid size-9 place-items-center rounded-xl bg-brand text-white"><MessageCircle size={19} fill="currentColor" /></span>contexta.</div>
      <span className="grid size-11 place-items-center rounded-2xl bg-brand-soft text-brand"><ShieldCheck size={23} /></span><h2 className="mt-5 text-3xl font-semibold tracking-tight">Boas-vindas</h2><p className="mt-2 text-sm leading-6 text-muted">Acesse o ambiente administrativo com sua senha.</p><LoginForm />
    </div></section>
  </main>;
}
