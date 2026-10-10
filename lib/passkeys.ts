import "server-only";

import { ApiError, backendFetch, itemsFrom } from "@/lib/api";
import {
  assertCanDeletePasskey,
  PasskeyError,
  toPublicPasskey,
  type PublicPasskey,
  type StoredPasskey,
} from "@/lib/passkeys-store";

export type { PublicPasskey, StoredPasskey };

type ApiPasskey = {
  id: string;
  public_key: string;
  counter: number;
  transports?: string[];
  device_type?: string;
  backed_up?: boolean;
  name: string;
  created_at: string;
};

function fromApi(passkey: ApiPasskey): StoredPasskey {
  return {
    id: passkey.id,
    publicKey: passkey.public_key,
    counter: passkey.counter,
    transports: passkey.transports,
    deviceType: passkey.device_type,
    backedUp: passkey.backed_up,
    name: passkey.name,
    createdAt: passkey.created_at,
  };
}

export async function listStoredPasskeys() {
  const payload = await backendFetch<ApiPasskey[] | { data: ApiPasskey[] }>("/api/v1/admin-passkeys");
  return itemsFrom(payload).map(fromApi);
}

export async function listPasskeys(): Promise<PublicPasskey[]> {
  try {
    return (await listStoredPasskeys()).map(toPublicPasskey);
  } catch {
    return [];
  }
}

export async function savePasskey(passkey: StoredPasskey) {
  try {
    await backendFetch("/api/v1/admin-passkeys", {
      method: "POST",
      body: {
        id: passkey.id,
        public_key: passkey.publicKey,
        counter: passkey.counter,
        transports: passkey.transports ?? [],
        device_type: passkey.deviceType ?? "",
        backed_up: passkey.backedUp ?? false,
        name: passkey.name,
      },
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      throw new PasskeyError("Esta passkey já está cadastrada.");
    }
    if (error instanceof ApiError && error.status === 400) {
      throw new PasskeyError("Não foi possível guardar a passkey.");
    }
    throw error;
  }
}

export async function savePasskeyCounter(id: string, counter: number) {
  await backendFetch(`/api/v1/admin-passkeys/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: { counter },
  });
}

export async function deleteStoredPasskey(id: string, passwordEnabled: boolean) {
  const credentials = await listStoredPasskeys();
  if (!credentials.some((item) => item.id === id)) throw new PasskeyError("Passkey não encontrada.");
  assertCanDeletePasskey(credentials.length, passwordEnabled);
  await backendFetch(`/api/v1/admin-passkeys/${encodeURIComponent(id)}`, { method: "DELETE" });
}
