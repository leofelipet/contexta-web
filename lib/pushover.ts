import "server-only";

import { apiFetch } from "@/lib/api";
import type { PushoverIntegration, PushoverSound } from "@/lib/types";

/** Sounds for the selectors; a listing failure must not block the page, so it falls back to the default tone only. */
export async function loadPushoverSounds(integration?: PushoverIntegration): Promise<PushoverSound[]> {
  try {
    const current = integration ?? (await apiFetch<PushoverIntegration>("/api/v1/integrations/pushover"));
    if (!current.configured) return [];
    const response = await apiFetch<{ sounds: PushoverSound[] }>("/api/v1/integrations/pushover/sounds");
    return response.sounds;
  } catch {
    return [];
  }
}
