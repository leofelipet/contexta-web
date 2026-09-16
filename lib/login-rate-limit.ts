import "server-only";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS_PER_CLIENT = 5;
const MAX_ATTEMPTS_GLOBAL = 50;

type Attempt = { count: number; resetAt: number };

const attempts = new Map<string, Attempt>();

function current(key: string, now: number) {
  if (attempts.size > 1000) {
    for (const [storedKey, value] of attempts) {
      if (value.resetAt <= now) attempts.delete(storedKey);
    }
  }
  const value = attempts.get(key);
  if (!value || value.resetAt <= now) {
    const fresh = { count: 0, resetAt: now + WINDOW_MS };
    attempts.set(key, fresh);
    return fresh;
  }
  return value;
}

export function loginAllowed(client: string) {
  const now = Date.now();
  return current(client, now).count < MAX_ATTEMPTS_PER_CLIENT && current("*", now).count < MAX_ATTEMPTS_GLOBAL;
}

export function recordFailedLogin(client: string) {
  const now = Date.now();
  current(client, now).count++;
  current("*", now).count++;
}

export function clearClientAttempts(client: string) {
  attempts.delete(client);
}
