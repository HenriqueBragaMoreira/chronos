import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
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

interface CategoryCount {
  category: string;
  pending: number;
  completed: number;
}

export function CategoryChart() {
  const [data, setData] = useState<CategoryCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    invoke<CategoryCount[]>("get_category_distribution")
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const chartHeight = Math.max(180, data.length * 44);

  return (
    <div className="rounded-lg border p-5 space-y-4">
      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
        Distribuição por categoria
      </h3>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : data.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10">
          Nenhuma tarefa cadastrada.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
            <XAxis type="number" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
            <YAxis
              type="category"
              dataKey="category"
              width={110}
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
            />
            <Tooltip
              contentStyle={{ fontSize: 12 }}
              formatter={(value, name) => [
                value,
                name === "pending" ? "Pendentes" : "Concluídas",
              ]}
              labelStyle={{ fontWeight: 600 }}
            />
            <Legend
              formatter={(value) => (value === "pending" ? "Pendentes" : "Concluídas")}
              wrapperStyle={{ fontSize: 12 }}
            />
            <Bar dataKey="completed" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
            <Bar dataKey="pending" stackId="a" fill="#3b82f6" radius={[0, 3, 3, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
