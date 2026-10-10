import { NextResponse } from "next/server";
import { buildApiUrl } from "@/lib/api-url";
import { hasSession } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!(await hasSession())) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const base = process.env.CONTEXTA_API_URL;
  const token = process.env.CONTEXTA_API_TOKEN;
  if (!base || !token) return NextResponse.json({ error: "Configuração do backend ausente" }, { status: 500 });

  const upstream = await fetch(buildApiUrl(base, "/api/v1/events"), {
    headers: { Authorization: `Bearer ${token}`, Accept: "text/event-stream" },
    cache: "no-store",
    signal: request.signal,
  });
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "Não foi possível abrir eventos." }, { status: 502 });
  }
  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
