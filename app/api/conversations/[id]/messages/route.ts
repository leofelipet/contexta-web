import { NextResponse, type NextRequest } from "next/server";
import { apiFetch } from "@/lib/api";
import { allowMessageParams } from "@/lib/api-url";
import { hasSession } from "@/lib/session";
import type { Message, Paginated } from "@/lib/types";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasSession())) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { id } = await params;
  if (!/^[\w.-]+$/.test(id)) return NextResponse.json({ error: "Conversa inválida" }, { status: 400 });
  try {
    const data = await apiFetch<Paginated<Message> | Message[]>(`/api/v1/conversations/${encodeURIComponent(id)}/messages`, {
      query: allowMessageParams(request.nextUrl.searchParams),
    });
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Não foi possível carregar as mensagens." }, { status: 502 });
  }
}
