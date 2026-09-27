export type EmailPreset = {
  id: string;
  label: string;
  imapHost: string;
  imapPort: number;
  smtpHost: string;
  smtpPort: number;
  hint?: string;
};

export const emailPresets: EmailPreset[] = [
  { id: "custom", label: "Outro servidor", imapHost: "", imapPort: 993, smtpHost: "", smtpPort: 465 },
  {
    id: "gmail",
    label: "Gmail / Google Workspace",
    imapHost: "imap.gmail.com",
    imapPort: 993,
    smtpHost: "smtp.gmail.com",
    smtpPort: 465,
    hint: "Use uma senha de app (conta Google › Segurança › Senhas de app). IMAP precisa estar habilitado.",
  },
  {
    id: "microsoft",
    label: "Microsoft 365 / Outlook",
    imapHost: "outlook.office365.com",
    imapPort: 993,
    smtpHost: "smtp.office365.com",
    smtpPort: 587,
    hint: "Só funciona se o tenant permitir autenticação básica (IMAP/SMTP AUTH) para a caixa.",
  },
];

type Body = Record<string, string | number | boolean>;

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function port(formData: FormData, key: string) {
  const value = Number.parseInt(text(formData, key), 10);
  return Number.isFinite(value) ? value : 0;
}

function checked(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function connectionFields(formData: FormData): Body {
  const address = text(formData, "address");
  return {
    name: text(formData, "name"),
    address,
    username: text(formData, "username") || address,
    imap_host: text(formData, "imap_host"),
    imap_port: port(formData, "imap_port"),
    imap_use_tls: checked(formData, "imap_use_tls"),
    smtp_host: text(formData, "smtp_host"),
    smtp_port: port(formData, "smtp_port"),
    smtp_use_tls: checked(formData, "smtp_use_tls"),
    enabled: checked(formData, "enabled"),
  };
}

/** Password is sent verbatim: leading/trailing spaces can be part of it. */
export function createEmailAccountBody(formData: FormData): Body {
  const body = connectionFields(formData);
  body.password = String(formData.get("password") ?? "");
  const saveSent = text(formData, "save_sent_copy");
  if (saveSent === "yes" || saveSent === "no") body.save_sent_copy = saveSent === "yes";
  return body;
}

/** An empty password keeps the stored one. */
export function updateEmailAccountBody(formData: FormData): Body {
  const body = connectionFields(formData);
  body.save_sent_copy = checked(formData, "save_sent_copy");
  const password = String(formData.get("password") ?? "");
  if (password.trim()) body.password = password;
  return body;
}

export function emailApiErrorMessage(status: number, detail?: string) {
  if (status === 503 && detail?.includes("EMAIL_CREDENTIALS_KEY")) {
    return "A API está sem EMAIL_CREDENTIALS_KEY configurada. Defina a variável no backend e reinicie.";
  }
  if (status === 400) return "Dados inválidos ou endereço já cadastrado. Confira e-mail, servidores e portas.";
  if (status === 404) return "Conta de e-mail não encontrada.";
  if (status === 409) return "A conta está desativada.";
  return "Não foi possível salvar agora. Tente novamente.";
}
