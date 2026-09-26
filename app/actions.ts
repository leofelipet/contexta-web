"use server";

import { compare } from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { clearSession, createSession, requireSession } from "@/lib/session";
import { clearClientAttempts, loginAllowed, recordFailedLogin } from "@/lib/login-rate-limit";

export type LoginState = { error?: string };

export async function login(_: LoginState, formData: FormData): Promise<LoginState> {
  const password = formData.get("password");
  const hash = process.env.ADMIN_PASSWORD_HASH;
  const requestHeaders = await headers();
  const client = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || requestHeaders.get("x-real-ip") || "unknown";
  if (!loginAllowed(client)) return { error: "Muitas tentativas. Aguarde alguns minutos." };
  if (typeof password !== "string" || password.length > 256 || !hash || !(await compare(password, hash))) {
    recordFailedLogin(client);
    return { error: "Senha incorreta. Tente novamente." };
  }
  clearClientAttempts(client);
  await createSession();
  redirect("/dashboard");
}

export async function logout() {
  await requireSession();
  await clearSession();
  redirect("/login");
}

export async function configureWebhook() {
  await requireSession();
  await apiFetch<{ configured: true }>("/api/v1/integrations/uazapi/configure-webhook", { method: "POST" });
  redirect("/whatsapp?configured=1");
}

export async function addDenylistEntry(formData: FormData) {
  await requireSession();
  const targetType = String(formData.get("target_type") || "").trim();
  const targetId = String(formData.get("target_id") || "").trim();
  const reason = String(formData.get("reason") || "").trim();
  await apiFetch("/api/v1/denylist", {
    method: "POST",
    body: {
      target_type: targetType,
      target_id: targetId,
      ...(reason ? { reason } : {}),
    },
  });
  redirect("/denylist?added=1");
}

export async function removeDenylistEntry(formData: FormData) {
  await requireSession();
  const id = String(formData.get("id") || "").trim();
  await apiFetch(`/api/v1/denylist/${encodeURIComponent(id)}`, { method: "DELETE" });
  redirect("/denylist?removed=1");
}
