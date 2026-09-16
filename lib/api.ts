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
  method?: "GET" | "POST";
} = {}): Promise<T> {
  await requireSession();
  const base = process.env.CONTEXTA_API_URL;
  const token = process.env.CONTEXTA_API_TOKEN;
  if (!base || !token) throw new Error("Configuração do backend ausente");

  let response: Response;
  try {
    response = await fetch(buildApiUrl(base, path, options.query), {
      method: options.method ?? "GET",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });
  } catch {
    throw new ApiError(503);
  }
  if (!response.ok) throw new ApiError(response.status);
  return response.json() as Promise<T>;
}

export function itemsFrom<T>(payload: T[] | { data: T[] }) {
  return Array.isArray(payload) ? payload : payload.data;
}
