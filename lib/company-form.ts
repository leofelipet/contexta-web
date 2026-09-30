export function companyBody(formData: FormData) {
  const text = (key: string) => String(formData.get(key) || "").trim();
  return { name: text("name"), notes: text("notes") };
}

export function companyApiErrorMessage(status: number) {
  if (status === 409) return "Já existe uma empresa com esse nome.";
  if (status === 400) return "Dados inválidos. O nome é obrigatório e tem até 200 caracteres.";
  if (status === 404) return "Empresa não encontrada.";
  return "Não foi possível salvar agora. Tente novamente.";
}

/** Only company pages may be used as a post-action redirect target. */
export function companyReturnPath(value: FormDataEntryValue | null) {
  const path = String(value || "");
  return /^\/empresas\/\d+$/.test(path) ? path : null;
}
