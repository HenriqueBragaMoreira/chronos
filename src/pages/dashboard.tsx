import { CompletionRateCard } from "@/components/dashboard/completion-rate-card";
import { StreakCard } from "@/components/dashboard/streak-card";
import { CategoryChart } from "@/components/dashboard/category-chart";
import { HistoryChart } from "@/components/dashboard/history-chart";
import { MostForgottenList } from "@/components/dashboard/most-forgotten-list";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Row 1: streak (narrow) + completion rate (wide) */}
        <div className="md:col-span-1">
          <StreakCard />
        </div>
        <div className="md:col-span-2">
          <CompletionRateCard />
        </div>

        {/* Row 2: history full width */}
        <div className="md:col-span-3">
          <HistoryChart />
        </div>

        {/* Row 3: category chart (wide) + most forgotten (narrow) */}
        <div className="md:col-span-2">
          <CategoryChart />
        </div>
        <div className="md:col-span-1">
          <MostForgottenList />
        </div>
      </div>
    </div>
  );
}
