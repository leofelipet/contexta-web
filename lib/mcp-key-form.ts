import type { McpAccess } from "@/lib/types";

const DAY_MS = 24 * 60 * 60 * 1000;
export const mcpKeyValidity = [
  { value: "30", label: "30 dias" },
  { value: "90", label: "90 dias" },
  { value: "365", label: "1 ano" },
  { value: "", label: "Sem validade" },
];

/** Body for PATCH; create adds expires_at from the "validity" field (days, empty = never). */
export function mcpKeyBody(formData: FormData, withExpiry = false, now = Date.now()) {
  const access = String(formData.get("access") || "") as McpAccess;
  const body: { name: string; access: McpAccess; tools: string[]; expires_at?: string } = {
    name: String(formData.get("name") || "").trim(),
    access,
    tools: access === "custom" ? formData.getAll("tools").map(String) : [],
  };
  const days = Number(formData.get("validity") || 0);
  if (withExpiry && days > 0) body.expires_at = new Date(now + days * DAY_MS).toISOString();
  return body;
}

export function mcpKeyErrorMessage(detail?: string) {
  if (detail?.includes("name")) return "Informe um nome com até 64 caracteres.";
  if (detail?.includes("custom access")) return "Escolha ao menos uma ferramenta.";
  if (detail?.includes("unknown tool")) return "Uma das ferramentas escolhidas não existe mais. Recarregue a página.";
  if (detail?.includes("at most")) return "Limite de chaves atingido. Revogue alguma antes.";
  return "Não foi possível salvar a chave. Tente novamente.";
}
