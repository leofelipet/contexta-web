"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardNamedCount, DashboardTrafficDay } from "@/lib/types";

const inboundColor = "#087f5b";
const outboundColor = "#3b82f6";
const typeColors = ["#087f5b", "#0ca678", "#38bdf8", "#64748b", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6"];

function formatDayLabel(value: string) {
  const date = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(date.valueOf())) return value;
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(date);
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-white px-3 py-2 text-xs shadow-lg">
      {label && <p className="mb-1.5 font-semibold text-ink">{label}</p>}
      {payload.map((item) => (
        <p key={item.name} className="flex items-center gap-2 text-muted">
          <span className="size-2 rounded-full" style={{ background: item.color }} />
          <span>{item.name}</span>
          <span className="ml-auto font-semibold text-ink">{Number(item.value || 0).toLocaleString("pt-BR")}</span>
        </p>
      ))}
    </div>
  );
}

export function TrafficChart({ data }: { data: DashboardTrafficDay[] }) {
  const chartData = data.map((item) => ({
    ...item,
    label: formatDayLabel(item.date),
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="inboundFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={inboundColor} stopOpacity={0.28} />
              <stop offset="95%" stopColor={inboundColor} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="outboundFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={outboundColor} stopOpacity={0.22} />
              <stop offset="95%" stopColor={outboundColor} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#e8eeea" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#66736d", fontSize: 12 }} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={36} tick={{ fill: "#66736d", fontSize: 12 }} />
          <Tooltip content={<ChartTooltip />} />
          <Area type="monotone" dataKey="inbound" name="Recebidas" stroke={inboundColor} fill="url(#inboundFill)" strokeWidth={2.5} />
          <Area type="monotone" dataKey="outbound" name="Enviadas" stroke={outboundColor} fill="url(#outboundFill)" strokeWidth={2.5} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DirectionChart({ inbound, outbound }: { inbound: number; outbound: number }) {
  const data = [
    { name: "Recebidas", value: inbound, color: inboundColor },
    { name: "Enviadas", value: outbound, color: outboundColor },
  ];
  const total = inbound + outbound;

  return (
    <div className="flex h-56 items-center gap-4">
      <div className="h-44 w-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={3} strokeWidth={0}>
              {data.map((item) => (
                <Cell key={item.name} fill={item.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="min-w-0 flex-1 space-y-3">
        {data.map((item) => {
          const pct = total ? Math.round((item.value / total) * 100) : 0;
          return (
            <div key={item.name}>
              <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-2 font-medium">
                  <span className="size-2.5 rounded-full" style={{ background: item.color }} />
                  {item.name}
                </span>
                <span className="text-muted">{pct}%</span>
              </div>
              <p className="text-lg font-semibold tracking-tight">{item.value.toLocaleString("pt-BR")}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MessageTypesChart({ data }: { data: DashboardNamedCount[] }) {
  const chartData = data.map((item) => ({
    name: typeLabel(item.name),
    count: item.count,
  }));

  if (!chartData.length) {
    return <p className="py-10 text-center text-sm text-muted">Sem mensagens no período.</p>;
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 4 }}>
          <CartesianGrid stroke="#e8eeea" horizontal={false} />
          <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#66736d", fontSize: 12 }} />
          <YAxis type="category" dataKey="name" width={78} tickLine={false} axisLine={false} tick={{ fill: "#66736d", fontSize: 12 }} />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="count" name="Mensagens" radius={[0, 8, 8, 0]}>
            {chartData.map((_, index) => (
              <Cell key={index} fill={typeColors[index % typeColors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function typeLabel(value: string) {
  const map: Record<string, string> = {
    text: "Texto",
    image: "Imagem",
    audio: "Áudio",
    video: "Vídeo",
    document: "Documento",
    sticker: "Figurinha",
    reaction: "Reação",
    unknown: "Outros",
  };
  return map[value] || value;
}
