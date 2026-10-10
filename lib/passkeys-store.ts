export class PasskeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PasskeyError";
  }
}

export type StoredPasskey = {
  id: string;
  publicKey: string;
  counter: number;
  transports?: string[];
  deviceType?: string;
  backedUp?: boolean;
  name: string;
  createdAt: string;
};

export type PublicPasskey = {
  id: string;
  name: string;
  createdAt: string;
  deviceType?: string;
  backedUp?: boolean;
};

export function toPublicPasskey(passkey: StoredPasskey): PublicPasskey {
  return {
    id: passkey.id,
    name: passkey.name,
    createdAt: passkey.createdAt,
    deviceType: passkey.deviceType,
    backedUp: passkey.backedUp,
  };
}

export function bytesToBase64Url(bytes: Uint8Array) {
  return Buffer.from(bytes).toString("base64url");
}

export function base64UrlToBytes(value: string) {
  return new Uint8Array(Buffer.from(value, "base64url"));
}

export function sanitizePasskeyName(name: string) {
  const trimmed = name.trim().slice(0, 64);
  return trimmed || "Passkey";
}

export function assertCanDeletePasskey(count: number, passwordEnabled: boolean) {
  if (!passwordEnabled && count <= 1) {
    throw new PasskeyError("Não é possível remover a última passkey enquanto a senha está desativada.");
  }
}
