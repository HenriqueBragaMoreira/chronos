import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

interface MostForgotten {
  id: string;
  name: string;
  category: string | null;
  total: number;
  missed: number;
  frequency: number;
}

function frequencyColor(freq: number): string {
  if (freq >= 70) return "text-red-600 dark:text-red-400";
  if (freq >= 40) return "text-yellow-600 dark:text-yellow-400";
  return "text-green-600 dark:text-green-400";
}

export function MostForgottenList() {
  const [data, setData] = useState<MostForgotten[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    invoke<MostForgotten[]>("get_most_forgotten")
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="rounded-lg border p-5 space-y-4">
      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
        Mais esquecidas
      </h3>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="Tudo em dia!"
          description="Nenhuma tarefa recorrente com atrasos."
        />
      ) : (
        <ol className="space-y-3">
          {data.map((item, i) => (
            <li key={item.id} className="flex items-center gap-3">
              <span className="text-sm font-bold text-muted-foreground w-4 flex-shrink-0">
                {i + 1}
              </span>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {item.missed} de {item.total} {item.total === 1 ? "vez" : "vezes"}
                </p>
              </div>

              {item.category && (
                <Badge variant="secondary" className="text-xs flex-shrink-0">
                  {item.category}
                </Badge>
              )}

              <span className={`text-sm font-bold tabular-nums flex-shrink-0 ${frequencyColor(item.frequency)}`}>
                {Math.round(item.frequency)}%
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
