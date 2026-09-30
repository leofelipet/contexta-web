"use client";

import { useActionState, useState, useTransition } from "react";
import { LoaderCircle, Plus, Trash2 } from "lucide-react";
import { createCompany, deleteCompany, updateCompany, type CompanyFormState } from "@/app/actions";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { Company } from "@/lib/types";

const initialState: CompanyFormState = {};
const inputClass = "focus-ring w-full rounded-xl border border-line px-3 py-2.5 text-sm";

export function CompanyCreate() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="focus-ring mb-6 inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
      >
        <Plus size={16} />Nova empresa
      </button>
    );
  }

  return (
    <section className="mb-6 rounded-2xl border border-line bg-white p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">Nova empresa</h2>
        <button type="button" onClick={() => setOpen(false)} className="focus-ring rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-slate-100">
          Fechar
        </button>
      </div>
      <div className="mt-5">
        <CompanyForm />
      </div>
    </section>
  );
}

export function CompanyForm({ company }: { company?: Company }) {
  const editing = Boolean(company);
  const [state, action, pending] = useActionState(editing ? updateCompany : createCompany, initialState);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, startDelete] = useTransition();

  return (
    <>
      <form action={action} className="grid gap-4">
        {company ? <input type="hidden" name="id" value={company.id} /> : null}
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Nome</span>
          <input name="name" required maxLength={200} defaultValue={company?.name} placeholder="Ex.: ACME Ltda." className={inputClass} />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Observações</span>
          <textarea name="notes" rows={4} maxLength={10000} defaultValue={company?.notes || ""} placeholder="Contexto, contrato, pessoas-chave…" className={inputClass} />
        </label>

        {state.error ? <p role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">{state.error}</p> : null}

        <div className="flex flex-wrap items-center gap-3">
          <button disabled={pending} className="focus-ring inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
            {pending ? <LoaderCircle className="animate-spin" size={16} /> : null}
            {editing ? "Salvar" : "Criar empresa"}
          </button>
          {company ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="focus-ring inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50"
            >
              <Trash2 size={16} />Apagar
            </button>
          ) : null}
        </div>
      </form>
      {company ? (
        <ConfirmDialog
          open={confirmDelete}
          busy={deleting}
          title="Apagar empresa?"
          description={`“${company.name}” será removida. Tarefas, recorrências e contatos vinculados são mantidos, apenas sem empresa.`}
          confirmLabel="Apagar"
          cancelLabel="Cancelar"
          onCancel={() => { if (!deleting) setConfirmDelete(false); }}
          onConfirm={() => {
            startDelete(async () => {
              const formData = new FormData();
              formData.set("id", company.id);
              await deleteCompany(formData);
            });
          }}
        />
      ) : null}
    </>
  );
}
