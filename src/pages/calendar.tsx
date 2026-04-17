import { useState } from "react";
import { MonthlyCalendarView } from "@/components/calendar/monthly-calendar-view";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Calendário</h1>

      <MonthlyCalendarView
        currentDate={currentDate}
        onMonthChange={setCurrentDate}
      />
    </div>
  );
}
