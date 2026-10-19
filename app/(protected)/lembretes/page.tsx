import type { Metadata } from "next";
import Link from "next/link";
import { BellRing, Check } from "lucide-react";
import { ReminderCreateForm, ReminderDeleteButton } from "@/components/reminder-forms";
import { SectionTabs } from "@/components/section-tabs";
import { tarefasTabs } from "@/components/section-tab-items";
import { Badge, EmptyState, PageHeader } from "@/components/ui";
import { apiFetch, itemsFrom } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { loadPushoverSounds } from "@/lib/pushover";
import { priorityLabel } from "@/lib/pushover-options";
import { defaultSendAt, deliveryErrorLabel } from "@/lib/reminder-form";
import type { Paginated, PushoverIntegration, PushoverSound, Reminder } from "@/lib/types";

export const metadata: Metadata = { title: "Lembretes" };

const statusBadge: Record<Reminder["status"], { label: string; tone: "success" | "danger" | "neutral" | "warning" }> = {
  pending: { label: "Agendado", tone: "warning" },
  sent: { label: "Enviado", tone: "success" },
  failed: { label: "Falhou", tone: "danger" },
};

export default async function LembretesPage({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const query = await searchParams;
  const integration = await apiFetch<PushoverIntegration>("/api/v1/integrations/pushover");
  const [pendingPayload, recentPayload, sounds] = await Promise.all([
    apiFetch<Reminder[] | Paginated<Reminder>>("/api/v1/reminders", { query: { status: "pending", limit: 100 } }),
    apiFetch<Reminder[] | Paginated<Reminder>>("/api/v1/reminders", { query: { limit: 30 } }),
    loadPushoverSounds(integration),
  ]);
  const upcoming = itemsFrom(pendingPayload).toSorted((a, b) => a.send_at.localeCompare(b.send_at));
  const history = itemsFrom(recentPayload).filter((reminder) => reminder.status !== "pending");
  const ready = integration.configured && integration.enabled;

  return (
    <div className="mx-auto max-w-5xl p-5 md:p-9 lg:p-12">
      <PageHeader
        eyebrow="Organização"
        title="Lembretes"
        description="Notificações avulsas no Pushover em um horário marcado. Para lembretes que se repetem, crie uma recorrência com notificação. Também disponíveis via MCP."
      />
      <SectionTabs items={tarefasTabs} />
      {query.deleted === "1" && (
        <p className="mb-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <Check size={17} />Lembrete removido.
        </p>
      )}
      {!ready && (
        <p className="mb-5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {integration.configured ? "A integração Pushover está desativada." : "A integração Pushover ainda não foi configurada."}{" "}
          <Link href="/pushover" className="font-semibold underline">Configurar Pushover</Link> para que os lembretes sejam entregues.
        </p>
      )}

      <ReminderCreateForm sounds={sounds} defaultSendAt={defaultSendAt(new Date())} disabled={!integration.configured} />

      <h2 className="mb-3 font-semibold">Próximos</h2>
      {upcoming.length ? <ReminderList reminders={upcoming} sounds={sounds} /> : <EmptyState title="Nenhum lembrete agendado" description="Agende um lembrete acima ou peça ao agente pelo MCP." />}

      {history.length ? (
        <>
          <h2 className="mb-3 mt-8 font-semibold">Recentes</h2>
          <ReminderList reminders={history} sounds={sounds} />
        </>
      ) : null}
    </div>
  );
}

function ReminderList({ reminders, sounds }: { reminders: Reminder[]; sounds: PushoverSound[] }) {
  const soundName = (id?: string | null) => (id ? sounds.find((sound) => sound.id === id)?.name ?? id : "Som padrão");
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white">
      {reminders.map((reminder) => {
        const badge = statusBadge[reminder.status];
        return (
          <div key={reminder.id} className="flex flex-wrap items-center gap-4 border-b border-line p-4 last:border-0">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sky-50 text-sky-700"><BellRing size={18} /></span>
            <div className="min-w-40 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-semibold">{reminder.title ? `${reminder.title}: ` : ""}{reminder.message}</p>
                <Badge tone={badge.tone}>{badge.label}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted">
                {[priorityLabel(reminder.priority), soundName(reminder.sound)].join(" · ")}
                {reminder.status === "pending" && reminder.attempts > 0 ? ` · ${reminder.attempts} tentativa(s) com erro` : ""}
              </p>
              {reminder.last_error && reminder.status !== "sent" ? <p className="mt-1 text-xs text-red-700">{deliveryErrorLabel(reminder.last_error)}</p> : null}
            </div>
            <div className="text-xs text-muted sm:text-right">
              <p>{reminder.status === "sent" && reminder.sent_at ? `Enviado ${formatDate(reminder.sent_at)}` : `Para ${formatDate(reminder.send_at)}`}</p>
            </div>
            <ReminderDeleteButton id={reminder.id} pending={reminder.status === "pending"} />
          </div>
        );
      })}
    </div>
  );
}
