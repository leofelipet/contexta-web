export type RelyingParty = {
  rpName: string;
  rpID: string;
  origin: string;
};

export function relyingParty(request: { url: string; headers: Headers }): RelyingParty {
  const originHeader = request.headers.get("origin");
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const url = originHeader
    ? new URL(originHeader)
    : forwardedHost && forwardedProto
      ? new URL(`${forwardedProto}://${forwardedHost}`)
      : new URL(request.url);
  const rpID = (process.env.WEBAUTHN_RP_ID?.trim() || url.hostname)
    .replace(/^https?:\/\//, "")
    .replace(/[:/].*$/, "");
  const origin = process.env.WEBAUTHN_ORIGIN?.trim() || url.origin;
  return { rpName: "Contexta", rpID, origin };
}
