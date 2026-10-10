export function passkeyCanceled(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const name = "name" in error ? String(error.name) : "";
  const cause = "cause" in error ? error.cause : undefined;
  const causeName = cause && typeof cause === "object" && "name" in cause ? String((cause as { name: unknown }).name) : "";
  return name === "NotAllowedError" || causeName === "NotAllowedError";
}

export function passkeyUserMessage(error: unknown, fallback = "Não foi possível usar a passkey. Tente novamente.") {
  if (passkeyCanceled(error)) return "Autenticação cancelada.";
  if (error instanceof Error && /not supported/i.test(error.message)) {
    return "Este navegador não suporta passkeys.";
  }
  return fallback;
}

export async function readApiError(response: Response, fallback: string) {
  const payload = await response.json().catch(() => null) as { error?: unknown } | null;
  return typeof payload?.error === "string" ? payload.error : fallback;
}
