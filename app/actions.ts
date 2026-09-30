"use server";

import { compare } from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ApiError, apiFetch } from "@/lib/api";
import { companyApiErrorMessage, companyBody, companyReturnPath } from "@/lib/company-form";
import { createEmailAccountBody, emailApiErrorMessage, updateEmailAccountBody } from "@/lib/email-form";
import { scheduleApiErrorMessage, scheduleBody, ScheduleFormError } from "@/lib/schedule-form";
import type { Company, EmailAccount, EmailTestResult, TaskSchedule } from "@/lib/types";
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
  const companyId = String(formData.get("company_id") || "").trim();
  const status = String(formData.get("status") || "").trim() || "pending";
  const dueAt = String(formData.get("due_at") || "").trim();
  const conversationId = String(formData.get("conversation_id") || "").trim();
  const contactId = String(formData.get("contact_id") || "").trim();
  await apiFetch("/api/v1/tasks", {
    method: "POST",
    body: {
      title,
      ...(description ? { description } : {}),
      ...(companyId ? { company_id: companyId } : {}),
      status,
      ...(dueAt ? { due_at: dueAt } : {}),
      ...(conversationId ? { conversation_id: conversationId } : {}),
      ...(contactId ? { contact_id: contactId } : {}),
    },
  });
  const returnPath = companyReturnPath(formData.get("return_to"));
  redirect(returnPath ? `${returnPath}?updated=1` : "/tarefas?created=1");
}

export async function updateTask(formData: FormData) {
  await requireSession();
  const id = String(formData.get("id") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const companyId = String(formData.get("company_id") || "").trim();
  const status = String(formData.get("status") || "").trim();
  const dueAt = String(formData.get("due_at") || "").trim();
  const conversationId = String(formData.get("conversation_id") || "").trim();
  const contactId = String(formData.get("contact_id") || "").trim();
  await apiFetch(`/api/v1/tasks/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: {
      title,
      description,
      company_id: companyId,
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

export type CompanyFormState = { error?: string };

function companyFormError(error: unknown): CompanyFormState {
  return { error: companyApiErrorMessage(error instanceof ApiError ? error.status : 0) };
}

export async function createCompany(_: CompanyFormState, formData: FormData): Promise<CompanyFormState> {
  await requireSession();
  let company: Company;
  try {
    company = await apiFetch<Company>("/api/v1/companies", { method: "POST", body: companyBody(formData) });
  } catch (error) {
    return companyFormError(error);
  }
  redirect(`/empresas/${encodeURIComponent(company.id)}?created=1`);
}

export async function updateCompany(_: CompanyFormState, formData: FormData): Promise<CompanyFormState> {
  await requireSession();
  const id = String(formData.get("id") || "").trim();
  try {
    await apiFetch<Company>(`/api/v1/companies/${encodeURIComponent(id)}`, { method: "PATCH", body: companyBody(formData) });
  } catch (error) {
    return companyFormError(error);
  }
  redirect(`/empresas/${encodeURIComponent(id)}?updated=1`);
}

export async function deleteCompany(formData: FormData) {
  await requireSession();
  const id = String(formData.get("id") || "").trim();
  await apiFetch(`/api/v1/companies/${encodeURIComponent(id)}`, { method: "DELETE" });
  redirect("/empresas?deleted=1");
}

/** Links (or with an empty company_id, unlinks) a task from a company page. */
export async function setCompanyTask(formData: FormData) {
  await requireSession();
  const pageCompanyId = String(formData.get("page_company_id") || "").trim();
  const taskId = String(formData.get("task_id") || "").trim();
  const companyId = String(formData.get("company_id") || "").trim();
  await apiFetch(`/api/v1/tasks/${encodeURIComponent(taskId)}`, { method: "PATCH", body: { company_id: companyId } });
  redirect(`/empresas/${encodeURIComponent(pageCompanyId)}?updated=1`);
}

export async function attachCompanyContact(formData: FormData) {
  await requireSession();
  const companyId = String(formData.get("company_id") || "").trim();
  const contactId = String(formData.get("contact_id") || "").trim();
  await apiFetch(`/api/v1/companies/${encodeURIComponent(companyId)}/contacts`, {
    method: "POST",
    body: { contact_id: contactId },
  });
  redirect(`/empresas/${encodeURIComponent(companyId)}?updated=1`);
}

export async function detachCompanyContact(formData: FormData) {
  await requireSession();
  const companyId = String(formData.get("company_id") || "").trim();
  const contactId = String(formData.get("contact_id") || "").trim();
  await apiFetch(
    `/api/v1/companies/${encodeURIComponent(companyId)}/contacts/${encodeURIComponent(contactId)}`,
    { method: "DELETE" },
  );
  redirect(`/empresas/${encodeURIComponent(companyId)}?updated=1`);
}

/** Sets the contact's company from the contact page; empty clears it. */
export async function setContactCompany(formData: FormData) {
  await requireSession();
  const contactId = String(formData.get("contact_id") || "").trim();
  const companyId = String(formData.get("company_id") || "").trim();
  const currentCompanyId = String(formData.get("current_company_id") || "").trim();
  if (companyId) {
    await apiFetch(`/api/v1/companies/${encodeURIComponent(companyId)}/contacts`, {
      method: "POST",
      body: { contact_id: contactId },
    });
  } else if (currentCompanyId) {
    await apiFetch(
      `/api/v1/companies/${encodeURIComponent(currentCompanyId)}/contacts/${encodeURIComponent(contactId)}`,
      { method: "DELETE" },
    );
  }
  redirect(`/contacts/${encodeURIComponent(contactId)}?updated=1`);
}

export type ScheduleFormState = { error?: string };

function scheduleFormError(error: unknown): ScheduleFormState {
  if (error instanceof ScheduleFormError) return { error: error.message };
  if (error instanceof ApiError) return { error: scheduleApiErrorMessage(error.status, error.detail) };
  return { error: scheduleApiErrorMessage(0) };
}

export async function createTaskSchedule(_: ScheduleFormState, formData: FormData): Promise<ScheduleFormState> {
  await requireSession();
  let schedule: TaskSchedule;
  try {
    schedule = await apiFetch<TaskSchedule>("/api/v1/task-schedules", {
      method: "POST",
      body: scheduleBody(formData, false),
    });
  } catch (error) {
    return scheduleFormError(error);
  }
  redirect(`/recorrentes/${encodeURIComponent(schedule.id)}?created=1`);
}

export async function updateTaskSchedule(_: ScheduleFormState, formData: FormData): Promise<ScheduleFormState> {
  await requireSession();
  const id = String(formData.get("id") || "").trim();
  try {
    await apiFetch<TaskSchedule>(`/api/v1/task-schedules/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: scheduleBody(formData, true),
    });
  } catch (error) {
    return scheduleFormError(error);
  }
  redirect(`/recorrentes/${encodeURIComponent(id)}?updated=1`);
}

export async function setTaskScheduleEnabled(formData: FormData) {
  await requireSession();
  const id = String(formData.get("id") || "").trim();
  const enabled = formData.get("enabled") === "true";
  await apiFetch(`/api/v1/task-schedules/${encodeURIComponent(id)}`, { method: "PATCH", body: { enabled } });
  redirect(`/recorrentes/${encodeURIComponent(id)}?updated=1`);
}

export async function deleteTaskSchedule(formData: FormData) {
  await requireSession();
  const id = String(formData.get("id") || "").trim();
  await apiFetch(`/api/v1/task-schedules/${encodeURIComponent(id)}`, { method: "DELETE" });
  redirect("/recorrentes?deleted=1");
}

export async function attachTaskMemory(formData: FormData) {
  await requireSession();
  const taskId = String(formData.get("task_id") || "").trim();
  const memoryId = String(formData.get("memory_id") || "").trim();
  await apiFetch(`/api/v1/tasks/${encodeURIComponent(taskId)}/memories`, {
    method: "POST",
    body: { memory_id: memoryId },
  });
  redirect(`/tarefas/${encodeURIComponent(taskId)}?updated=1`);
}

export async function detachTaskMemory(formData: FormData) {
  await requireSession();
  const taskId = String(formData.get("task_id") || "").trim();
  const memoryId = String(formData.get("memory_id") || "").trim();
  await apiFetch(
    `/api/v1/tasks/${encodeURIComponent(taskId)}/memories/${encodeURIComponent(memoryId)}`,
    { method: "DELETE" },
  );
  redirect(`/tarefas/${encodeURIComponent(taskId)}?updated=1`);
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

export type EmailFormState = { error?: string };

function emailFormError(error: unknown): EmailFormState {
  if (error instanceof ApiError) return { error: emailApiErrorMessage(error.status, error.detail) };
  return { error: emailApiErrorMessage(0) };
}

export async function createEmailAccount(_: EmailFormState, formData: FormData): Promise<EmailFormState> {
  await requireSession();
  let account: EmailAccount;
  try {
    account = await apiFetch<EmailAccount>("/api/v1/email-accounts", {
      method: "POST",
      body: createEmailAccountBody(formData),
    });
  } catch (error) {
    return emailFormError(error);
  }
  redirect(`/email/${encodeURIComponent(account.id)}?created=1`);
}

export async function updateEmailAccount(_: EmailFormState, formData: FormData): Promise<EmailFormState> {
  await requireSession();
  const id = String(formData.get("id") || "").trim();
  try {
    await apiFetch<EmailAccount>(`/api/v1/email-accounts/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: updateEmailAccountBody(formData),
    });
  } catch (error) {
    return emailFormError(error);
  }
  redirect(`/email/${encodeURIComponent(id)}?updated=1`);
}

export async function deleteEmailAccount(formData: FormData) {
  await requireSession();
  const id = String(formData.get("id") || "").trim();
  await apiFetch(`/api/v1/email-accounts/${encodeURIComponent(id)}`, { method: "DELETE" });
  redirect("/email?deleted=1");
}

export type EmailTestState = { result?: EmailTestResult; error?: string };

export async function testEmailAccount(_: EmailTestState, formData: FormData): Promise<EmailTestState> {
  await requireSession();
  const id = String(formData.get("id") || "").trim();
  try {
    const result = await apiFetch<EmailTestResult>(`/api/v1/email-accounts/${encodeURIComponent(id)}/test`, {
      method: "POST",
      acceptStatus: [502],
    });
    return { result };
  } catch (error) {
    return emailFormError(error);
  }
}
