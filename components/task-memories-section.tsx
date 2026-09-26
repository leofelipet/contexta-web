"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Link2Off } from "lucide-react";
import { attachTaskMemory, detachTaskMemory } from "@/app/actions";
import type { Memory, TaskMemoryRef } from "@/lib/types";

const sourceLabel: Record<string, string> = {
  note: "Nota",
  message: "Mensagem",
};

export function TaskMemoriesSection({
  taskId,
  linked,
  candidates,
}: {
  taskId: string;
  linked: TaskMemoryRef[];
  candidates: Memory[];
}) {
  const [pending, startTransition] = useTransition();
  const linkedIds = new Set(linked.map((item) => item.id));
  const available = candidates.filter((item) => !linkedIds.has(item.id));

  return (
    <section className="mt-6 rounded-2xl border border-line bg-white p-6">
      <h2 className="font-semibold">Memórias vinculadas</h2>
      <p className="mt-1 text-sm text-muted">Atrele quantas memórias quiser a esta tarefa. A memória continua existindo se você desvincular.</p>

      {linked.length ? (
        <ul className="mt-4 divide-y divide-line rounded-xl border border-line">
          {linked.map((memory) => (
            <li key={memory.id} className="flex flex-wrap items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <Link href={`/memorias/${encodeURIComponent(memory.id)}`} className="text-sm font-semibold hover:underline">
                  {memory.title || "Sem título"}
                </Link>
                <p className="text-xs text-muted">{sourceLabel[memory.source || ""] || memory.source || "Memória"}</p>
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  startTransition(async () => {
                    const formData = new FormData();
                    formData.set("task_id", taskId);
                    formData.set("memory_id", memory.id);
                    await detachTaskMemory(formData);
                  });
                }}
                className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
              >
                <Link2Off size={14} />Desvincular
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted">Nenhuma memória vinculada ainda.</p>
      )}

      <form action={attachTaskMemory} className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
        <input type="hidden" name="task_id" value={taskId} />
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Atrelar memória</span>
          <select name="memory_id" required defaultValue="" className="focus-ring w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm">
            <option value="" disabled>Selecione uma memória</option>
            {available.map((memory) => (
              <option key={memory.id} value={memory.id}>
                {memory.title || "Sem título"}
                {memory.source ? ` · ${sourceLabel[memory.source] || memory.source}` : ""}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <button className="focus-ring w-full rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark sm:w-auto">
            Atrelar
          </button>
        </div>
      </form>
      {!available.length && (
        <p className="mt-2 text-xs text-muted">
          {candidates.length ? "Todas as memórias listadas já estão vinculadas." : "Cadastre memórias em Memórias para poder atrelá-las aqui."}
        </p>
      )}
    </section>
  );
}
