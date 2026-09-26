import "server-only";

import { buildApiUrl, type QueryValue } from "@/lib/api-url";
import { requireSession } from "@/lib/session";

export class ApiError extends Error {
  constructor(public readonly status: number) {
    super(status >= 500 ? "O serviço está temporariamente indisponível." : "Não foi possível carregar os dados.");
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(path: string, options: {
  query?: Record<string, QueryValue>;
  method?: "GET" | "POST" | "DELETE";
  body?: unknown;
} = {}): Promise<T> {
  await requireSession();
  const base = process.env.CONTEXTA_API_URL;
  const token = process.env.CONTEXTA_API_TOKEN;
  if (!base || !token) throw new Error("Configuração do backend ausente");

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  let response: Response;
  try {
    response = await fetch(buildApiUrl(base, path, options.query), {
      method: options.method ?? "GET",
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new ApiError(503);
  }
  if (!response.ok) throw new ApiError(response.status);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function itemsFrom<T>(payload: T[] | { data: T[] }) {
  return Array.isArray(payload) ? payload : payload.data;
}
