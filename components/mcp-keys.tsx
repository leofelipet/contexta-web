"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Check, Copy, KeyRound, LoaderCircle, Pencil, Plus, Trash2, TriangleAlert } from "lucide-react";
import { createMcpKey, deleteMcpKey, updateMcpKey, type McpKeyFormState } from "@/app/actions";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Badge } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { mcpKeyValidity } from "@/lib/mcp-key-form";
import type { McpAccess, McpKey, McpTool } from "@/lib/types";

const initialState: McpKeyFormState = {};
const inputClass = "focus-ring w-full rounded-xl border border-line px-3 py-2.5 text-sm";
const buttonClass = "focus-ring inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold disabled:opacity-60";
const accessLabels: Record<McpAccess, string> = { read: "Somente leitura", write: "Leitura e escrita", custom: "Ferramentas escolhidas" };

export function McpKeys({ keys, tools }: { keys: McpKey[]; tools: McpTool[] }) {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [removing, setRemoving] = useState<McpKey | null>(null);
  const [deleting, startDelete] = useTransition();

  return (
    <section className="mt-7">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Chaves de acesso</h2>
          <p className="mt-1 text-sm text-muted">Cada agente usa a própria chave, com nome, validade e ferramentas permitidas.</p>
        </div>
        {!creating ? (
          <button type="button" onClick={() => setCreating(true)} className={`${buttonClass} bg-ink text-white hover:bg-brand-dark`}><Plus size={16} />Nova chave</button>
        ) : null}
      </div>

      {creating ? <CreateKey tools={tools} onClose={() => setCreating(false)} /> : null}

      {keys.length ? (
        <ul className="space-y-3">
          {keys.map((key) => (
            <li key={key.id} className="rounded-2xl border border-line bg-white p-5">
              {editing === key.id ? (
                <EditKey apiKey={key} tools={tools} onClose={() => setEditing(null)} />
              ) : (
                <KeyRow apiKey={key} tools={tools} onEdit={() => setEditing(key.id)} onRemove={() => setRemoving(key)} />
              )}
            </li>
          ))}
        </ul>
      ) : !creating ? (
        <p className="rounded-2xl border border-dashed border-line bg-surface p-6 text-center text-sm text-muted">Nenhuma chave criada. Agentes MCP não conseguem se conectar até você criar uma.</p>
      ) : null}

      <ConfirmDialog
        open={removing !== null}
        title="Revogar chave?"
        description={`Agentes que usam "${removing?.name}" perdem o acesso imediatamente. Não dá para desfazer.`}
        confirmLabel="Revogar"
        busy={deleting}
        onCancel={() => setRemoving(null)}
        onConfirm={() => startDelete(async () => {
          if (removing) await deleteMcpKey(removing.id);
          setRemoving(null);
        })}
      />
    </section>
  );
}

function KeyRow({ apiKey, tools, onEdit, onRemove }: { apiKey: McpKey; tools: McpTool[]; onEdit: () => void; onRemove: () => void }) {
  // Date.now() in render is fine here: the list re-renders on every refresh.
  // eslint-disable-next-line react-hooks/purity
  const expired = apiKey.expires_at ? new Date(apiKey.expires_at).getTime() <= Date.now() : false;
  const scope = apiKey.access === "custom"
    ? `${apiKey.tools.length} ${apiKey.tools.length === 1 ? "ferramenta" : "ferramentas"}`
    : `${tools.filter((tool) => apiKey.access === "write" || tool.read_only).length} ferramentas`;
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold">{apiKey.name}</h3>
          <code className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs text-muted">{apiKey.prefix}…</code>
          {expired ? <Badge tone="danger">Expirada</Badge> : <Badge tone={apiKey.access === "read" ? "success" : apiKey.access === "write" ? "warning" : "neutral"}>{accessLabels[apiKey.access]}</Badge>}
        </div>
        <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
          <div><dt className="inline">Escopo: </dt><dd className="inline">{scope}</dd></div>
          <div><dt className="inline">Criada: </dt><dd className="inline">{formatDate(apiKey.created_at)}</dd></div>
          <div><dt className="inline">Último uso: </dt><dd className="inline">{apiKey.last_used_at ? formatDate(apiKey.last_used_at) : "Nunca usada"}</dd></div>
          <div><dt className="inline">{expired ? "Expirou: " : "Expira: "}</dt><dd className="inline">{apiKey.expires_at ? formatDate(apiKey.expires_at) : "Sem validade"}</dd></div>
        </dl>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onEdit} className={`${buttonClass} border border-line hover:bg-slate-50`}><Pencil size={15} />Editar</button>
        <button type="button" onClick={onRemove} className={`${buttonClass} border border-red-200 text-red-700 hover:bg-red-50`}><Trash2 size={15} />Revogar</button>
      </div>
    </div>
  );
}

function CreateKey({ tools, onClose }: { tools: McpTool[]; onClose: () => void }) {
  const [state, action, pending] = useActionState(createMcpKey, initialState);
  if (state.token) return <CreatedToken token={state.token} onClose={onClose} />;
  return (
    <form action={action} className="mb-4 space-y-4 rounded-2xl border border-line bg-white p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm"><span className="mb-1.5 block font-medium">Nome</span><input name="name" required maxLength={64} autoFocus placeholder="Ex.: Claude Desktop no notebook" className={inputClass} /></label>
        <label className="block text-sm"><span className="mb-1.5 block font-medium">Validade</span>
          <select name="validity" defaultValue="90" className={`${inputClass} bg-white`}>{mcpKeyValidity.map((item) => <option key={item.label} value={item.value}>{item.label}</option>)}</select>
        </label>
      </div>
      <AccessFields tools={tools} />
      <FormFooter error={state.error} pending={pending} submitLabel="Criar chave" onCancel={onClose} />
    </form>
  );
}

function EditKey({ apiKey, tools, onClose }: { apiKey: McpKey; tools: McpTool[]; onClose: () => void }) {
  const [state, action, pending] = useActionState(updateMcpKey, initialState);
  useEffect(() => {
    if (state.saved) onClose();
  }, [state.saved, onClose]);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={apiKey.id} />
      <label className="block text-sm"><span className="mb-1.5 block font-medium">Nome</span><input name="name" required maxLength={64} defaultValue={apiKey.name} className={inputClass} /></label>
      <AccessFields tools={tools} access={apiKey.access} selected={apiKey.tools} />
      <p className="text-xs text-muted">A validade é definida na criação. Para trocar, crie outra chave e revogue esta.</p>
      <FormFooter error={state.error} pending={pending} submitLabel="Salvar" onCancel={onClose} />
    </form>
  );
}

function AccessFields({ tools, access = "read", selected = [] }: { tools: McpTool[]; access?: McpAccess; selected?: string[] }) {
  const [current, setCurrent] = useState<McpAccess>(access);
  const groups = [
    { title: "Leitura", items: tools.filter((tool) => tool.read_only) },
    { title: "Escrita", items: tools.filter((tool) => !tool.read_only) },
  ];
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium">Permissão</legend>
      <div className="grid gap-2 sm:grid-cols-3">
        {(Object.keys(accessLabels) as McpAccess[]).map((value) => (
          <label key={value} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm ${current === value ? "border-brand bg-brand-soft" : "border-line"}`}>
            <input type="radio" name="access" value={value} checked={current === value} onChange={() => setCurrent(value)} className="accent-brand" />
            {accessLabels[value]}
          </label>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted">
        {current === "read" && "Todas as ferramentas que só consultam dados, inclusive as que forem adicionadas no futuro."}
        {current === "write" && "Acesso total: consulta, altera, apaga e envia mensagens/e-mails."}
        {current === "custom" && "Apenas as ferramentas marcadas abaixo."}
      </p>
      {current === "custom" ? (
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          {groups.map((group) => (
            <div key={group.title}>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">{group.title}</p>
              <div className="max-h-72 space-y-1 overflow-y-auto rounded-xl border border-line p-2">
                {group.items.map((tool) => (
                  <label key={tool.name} title={tool.description} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50">
                    <input type="checkbox" name="tools" value={tool.name} defaultChecked={selected.includes(tool.name)} className="size-4 accent-brand" />
                    <span className="font-mono text-xs">{tool.name}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </fieldset>
  );
}

function FormFooter({ error, pending, submitLabel, onCancel }: { error?: string; pending: boolean; submitLabel: string; onCancel: () => void }) {
  return (
    <>
      {error ? <p role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p> : null}
      <div className="flex gap-2">
        <button disabled={pending} className={`${buttonClass} bg-ink text-white hover:bg-brand-dark`}>{pending ? <LoaderCircle className="animate-spin" size={16} /> : <Check size={16} />}{submitLabel}</button>
        <button type="button" disabled={pending} onClick={onCancel} className={`${buttonClass} border border-line hover:bg-slate-50`}>Cancelar</button>
      </div>
    </>
  );
}

function CreatedToken({ token, onClose }: { token: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <div role="status" className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <p className="flex items-center gap-2 font-semibold text-amber-900"><TriangleAlert size={18} />Copie a chave agora. Ela não será mostrada de novo.</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <code className="min-w-0 flex-1 break-all rounded-xl border border-amber-200 bg-white px-3 py-2.5 font-mono text-sm"><KeyRound size={14} className="mr-2 inline text-amber-700" />{token}</code>
        <button type="button" onClick={() => navigator.clipboard.writeText(token).then(() => setCopied(true))} className={`${buttonClass} bg-ink text-white hover:bg-brand-dark`}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? "Copiada" : "Copiar"}</button>
      </div>
      <p className="mt-3 text-xs text-amber-900">Use no cliente MCP como <code>Authorization: Bearer &lt;chave&gt;</code>.</p>
      <button type="button" onClick={onClose} className={`${buttonClass} mt-4 border border-amber-300 bg-white hover:bg-amber-100`}>Concluir</button>
    </div>
  );
}
