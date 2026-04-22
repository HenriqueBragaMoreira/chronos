import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Skeleton } from "@/components/ui/skeleton";

interface StreakData {
  current: number;
  record: number;
}

export function StreakCard() {
  const [data, setData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    invoke<StreakData>("get_streak")
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="rounded-lg border p-5 space-y-3">
      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
        Sequência atual
      </h3>

      {loading ? (
        <div className="space-y-3">
          <div className="flex items-end gap-3">
            <Skeleton className="h-12 w-20" />
            <Skeleton className="h-7 w-10" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          <Skeleton className="h-4 w-2/3" />
        </div>
      ) : (
        <div className="flex items-end gap-4">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold tabular-nums leading-none">
              {data?.current ?? 0}
            </span>
            <span className="text-lg text-muted-foreground">
              {(data?.current ?? 0) === 1 ? "dia" : "dias"}
            </span>
          </div>
          <span className="text-3xl leading-none pb-0.5" role="img" aria-label="fogo">
            {(data?.current ?? 0) >= 7 ? "🔥" : "⚡"}
          </span>
        </div>
      )}

      {!loading && data && (
        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
          <span role="img" aria-label="troféu">🏆</span>
          Recorde: <span className="font-medium text-foreground">{data.record} {data.record === 1 ? "dia" : "dias"}</span>
        </p>
      )}
    </div>
  );
}
