import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const WEEKDAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
}

function buildCalendarDays(year: number, month: number): CalendarDay[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDow = firstDay.getDay(); // 0 = domingo

  // Total de células = linhas completas de 7 necessárias
  const totalCells = Math.ceil((startDow + daysInMonth) / 7) * 7;

  const days: CalendarDay[] = [];
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - startDow + 1;
    const date = new Date(year, month, dayNum);
    days.push({
      date,
      isCurrentMonth: dayNum >= 1 && dayNum <= daysInMonth,
      isToday: date.getTime() === today.getTime(),
    });
  }

  return days;
}

export interface MonthlyCalendarViewProps {
  currentDate: Date;
  onMonthChange: (date: Date) => void;
  onDayClick?: (date: Date) => void;
  renderDayContent?: (date: Date) => React.ReactNode;
}

export function MonthlyCalendarView({
  currentDate,
  onMonthChange,
  onDayClick,
  renderDayContent,
}: MonthlyCalendarViewProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = buildCalendarDays(year, month);

  function prevMonth() {
    onMonthChange(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    onMonthChange(new Date(year, month + 1, 1));
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho de navegação */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={prevMonth} aria-label="Mês anterior">
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <h2 className="text-lg font-semibold">
          {MONTH_NAMES[month]} {year}
        </h2>

        <Button variant="outline" size="icon" onClick={nextMonth} aria-label="Próximo mês">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Grade do calendário */}
      <div className="grid grid-cols-7">
        {/* Nomes dos dias da semana */}
        {WEEKDAY_NAMES.map((name) => (
          <div
            key={name}
            className="py-2 text-center text-xs font-medium text-muted-foreground"
          >
            {name}
          </div>
        ))}

        {/* Células dos dias */}
        {days.map((day, idx) => (
          <div
            key={idx}
            onClick={() => onDayClick?.(day.date)}
            className={`min-h-[80px] border-t p-1 transition-colors ${
              onDayClick ? "cursor-pointer hover:bg-muted/50" : ""
            } ${day.isCurrentMonth ? "" : "opacity-30"}`}
          >
            <span
              className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                day.isToday
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-foreground"
              }`}
            >
              {day.date.getDate()}
            </span>

            {day.isCurrentMonth && renderDayContent && (
              <div className="mt-1 space-y-0.5">
                {renderDayContent(day.date)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
