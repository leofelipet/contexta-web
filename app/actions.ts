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
  const redirectTo = String(formData.get("redirect_to") || "").trim() || "/denylist?added=1";
  await apiFetch("/api/v1/denylist", {
    method: "POST",
    body: {
      target_type: targetType,
      target_id: targetId,
      ...(reason ? { reason } : {}),
    },
  });
  redirect(redirectTo.startsWith("/") ? redirectTo : "/denylist?added=1");
}

export async function removeDenylistEntry(formData: FormData) {
  await requireSession();
  const id = String(formData.get("id") || "").trim();
  await apiFetch(`/api/v1/denylist/${encodeURIComponent(id)}`, { method: "DELETE" });
  redirect("/denylist?removed=1");
}

export async function deleteStaleConversation(formData: FormData) {
  await requireSession();
  const id = String(formData.get("id") || "").trim();
  await apiFetch(`/api/v1/conversations/${encodeURIComponent(id)}`, { method: "DELETE" });
  redirect("/limpeza?deleted=1");
}

export async function deleteStaleConversationsBulk(formData: FormData) {
  await requireSession();
  const ids = formData.getAll("ids").map((value) => String(value).trim()).filter(Boolean);
  await apiFetch("/api/v1/conversations/bulk-delete", {
    method: "POST",
    body: { ids },
  });
  redirect(`/limpeza?deleted=${ids.length}`);
}

export async function createTask(formData: FormData) {
  await requireSession();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const company = String(formData.get("company") || "").trim();
  const status = String(formData.get("status") || "").trim() || "pending";
  const dueAt = String(formData.get("due_at") || "").trim();
  const conversationId = String(formData.get("conversation_id") || "").trim();
  const contactId = String(formData.get("contact_id") || "").trim();
  await apiFetch("/api/v1/tasks", {
    method: "POST",
    body: {
      title,
      ...(description ? { description } : {}),
      ...(company ? { company } : {}),
      status,
      ...(dueAt ? { due_at: dueAt } : {}),
      ...(conversationId ? { conversation_id: conversationId } : {}),
      ...(contactId ? { contact_id: contactId } : {}),
    },
  });
  redirect("/tarefas?created=1");
}

export async function updateTask(formData: FormData) {
  await requireSession();
  const id = String(formData.get("id") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const company = String(formData.get("company") || "").trim();
  const status = String(formData.get("status") || "").trim();
  const dueAt = String(formData.get("due_at") || "").trim();
  const conversationId = String(formData.get("conversation_id") || "").trim();
  const contactId = String(formData.get("contact_id") || "").trim();
  await apiFetch(`/api/v1/tasks/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: {
      title,
      description,
      company,
      status,
      due_at: dueAt,
      conversation_id: conversationId,
      contact_id: contactId,
    },
  });
  redirect(`/tarefas/${encodeURIComponent(id)}?updated=1`);
}

export async function deleteTask(formData: FormData) {
  await requireSession();
  const id = String(formData.get("id") || "").trim();
  await apiFetch(`/api/v1/tasks/${encodeURIComponent(id)}`, { method: "DELETE" });
  redirect("/tarefas?deleted=1");
}

export async function createMemory(formData: FormData) {
  await requireSession();
  const title = String(formData.get("title") || "").trim();
  const content = String(formData.get("content") || "").trim();
  const source = String(formData.get("source") || "").trim() || "note";
  const messageId = String(formData.get("message_id") || "").trim();
  const conversationId = String(formData.get("conversation_id") || "").trim();
  const contactId = String(formData.get("contact_id") || "").trim();
  await apiFetch("/api/v1/memories", {
    method: "POST",
    body: {
      title,
      content,
      source,
      ...(messageId ? { message_id: messageId } : {}),
      ...(conversationId ? { conversation_id: conversationId } : {}),
      ...(contactId ? { contact_id: contactId } : {}),
    },
  });
  redirect("/memorias?created=1");
}

export async function updateMemory(formData: FormData) {
  await requireSession();
  const id = String(formData.get("id") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const content = String(formData.get("content") || "").trim();
  const conversationId = String(formData.get("conversation_id") || "").trim();
  const contactId = String(formData.get("contact_id") || "").trim();
  await apiFetch(`/api/v1/memories/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: {
      title,
      content,
      conversation_id: conversationId,
      contact_id: contactId,
    },
  });
  redirect(`/memorias/${encodeURIComponent(id)}?updated=1`);
}

export async function deleteMemory(formData: FormData) {
  await requireSession();
  const id = String(formData.get("id") || "").trim();
  await apiFetch(`/api/v1/memories/${encodeURIComponent(id)}`, { method: "DELETE" });
  redirect("/memorias?deleted=1");
}
