export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const MAX_PASSKEYS = 10;

export function isPasswordEnabled() {
  const value = process.env.ADMIN_PASSWORD_ENABLED;
  if (value == null || value === "") return true;
  return !["0", "false", "FALSE", "False", "no", "off"].includes(value);
}

export function cookieSecure() {
  return process.env.SESSION_COOKIE_SECURE
    ? process.env.SESSION_COOKIE_SECURE === "true"
    : process.env.NODE_ENV === "production";
}
