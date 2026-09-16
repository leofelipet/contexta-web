export type QueryValue = string | number | boolean | null | undefined;

export function buildApiUrl(base: string, path: string, query?: Record<string, QueryValue>) {
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  const normalizedPath = path.replace(/^\//, "");
  const url = new URL(normalizedPath, normalizedBase);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  }
  return url;
}

export function allowMessageParams(params: URLSearchParams) {
  const allowed = new Set(["cursor", "limit"]);
  const result: Record<string, string> = {};
  for (const [key, value] of params) if (allowed.has(key) && value) result[key] = value;
  return result;
}
