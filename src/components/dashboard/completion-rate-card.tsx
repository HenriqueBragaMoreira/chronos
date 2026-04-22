import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Skeleton } from "@/components/ui/skeleton";

interface CompletionRate {
  on_time: number;
  late: number;
  missed: number;
  rate: number;
}

type Period = "week" | "month" | "year";

const PERIOD_LABEL: Record<Period, string> = {
  week: "Semana",
  month: "Mês",
  year: "Ano",
};

function rateColor(rate: number): string {
  if (rate >= 70) return "text-green-600 dark:text-green-400";
  if (rate >= 40) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

function rateRingColor(rate: number): string {
  if (rate >= 70) return "stroke-green-500";
  if (rate >= 40) return "stroke-yellow-500";
  return "stroke-red-500";
}

export function CompletionRateCard() {
  const [period, setPeriod] = useState<Period>("month");
  const [data, setData] = useState<CompletionRate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    invoke<CompletionRate>("get_completion_rate", { period })
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [period]);

  const rate = data ? Math.round(data.rate) : 0;
  const circumference = 2 * Math.PI * 36;
  const dash = data ? (rate / 100) * circumference : 0;

  return (
    <div className="rounded-lg border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Taxa de conclusão
        </h3>
        <div className="flex rounded-md border text-xs">
          {(["week", "month", "year"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-2 py-1 transition-colors first:rounded-l last:rounded-r ${
                period === p
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-muted-foreground"
              }`}
            >
              {PERIOD_LABEL[p]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-6">
          <Skeleton className="h-[88px] w-[88px] flex-shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-6">
          {/* Circular progress */}
          <div className="relative flex-shrink-0">
            <svg width="88" height="88" viewBox="0 0 88 88">
              <circle cx="44" cy="44" r="36" fill="none" stroke="currentColor"
                className="text-muted/30" strokeWidth="8" />
              <circle cx="44" cy="44" r="36" fill="none"
                className={rateRingColor(rate)}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circumference}`}
                strokeDashoffset={circumference * 0.25}
                transform="rotate(-90 44 44)"
              />
            </svg>
            <span className={`absolute inset-0 flex items-center justify-center text-xl font-bold ${rateColor(rate)}`}>
              {rate}%
            </span>
          </div>

          {/* Breakdown */}
          <div className="space-y-2 text-sm flex-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">No prazo</span>
              <span className="font-medium text-green-600 dark:text-green-400">
                {data?.on_time ?? 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Atrasadas</span>
              <span className="font-medium text-yellow-600 dark:text-yellow-400">
                {data?.late ?? 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Não feitas</span>
              <span className="font-medium text-red-600 dark:text-red-400">
                {data?.missed ?? 0}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
