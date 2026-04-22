import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface HistoryEntry {
  period: string;
  completed: number;
  pending: number;
}

type Granularity = "week" | "month";

const MONTH_SHORT = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

function formatPeriod(period: string, granularity: Granularity): string {
  if (granularity === "month") {
    // "YYYY-MM" → "Abr/26"
    const [year, month] = period.split("-");
    return `${MONTH_SHORT[parseInt(month, 10) - 1]}/${year.slice(2)}`;
  }
  // "YYYY-WW" → "S17"
  const week = period.split("-")[1];
  return `S${parseInt(week, 10)}`;
}

export function HistoryChart() {
  const [granularity, setGranularity] = useState<Granularity>("month");
  const [raw, setRaw] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    invoke<HistoryEntry[]>("get_history", { granularity })
      .then(setRaw)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [granularity]);

  const data = raw.map((entry) => ({
    ...entry,
    label: formatPeriod(entry.period, granularity),
  }));

  return (
    <div className="rounded-lg border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Histórico de tarefas
        </h3>
        <div className="flex rounded-md border text-xs">
          {(["week", "month"] as Granularity[]).map((g) => (
            <button
              key={g}
              onClick={() => setGranularity(g)}
              className={`px-2 py-1 transition-colors first:rounded-l last:rounded-r ${
                granularity === g
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-muted-foreground"
              }`}
            >
              {g === "week" ? "Semanas" : "Meses"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-[220px] w-full" />
      ) : data.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">
          Nenhum dado para o período.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 0, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
            <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" allowDecimals={false} />
            <Tooltip
              contentStyle={{ fontSize: 12 }}
              formatter={(value, name) => [
                value,
                name === "completed" ? "Concluídas" : "Pendentes",
              ]}
              labelStyle={{ fontWeight: 600 }}
            />
            <Legend
              formatter={(value) => (value === "completed" ? "Concluídas" : "Pendentes")}
              wrapperStyle={{ fontSize: 12 }}
            />
            <Bar dataKey="completed" stackId="a" fill="#22c55e" />
            <Bar dataKey="pending" stackId="a" fill="#3b82f6" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
