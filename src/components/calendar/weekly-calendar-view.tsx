import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const WEEKDAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const STATUS_CARD: Record<string, string> = {
  pending: "border-blue-400 bg-blue-50 dark:bg-blue-950/40",
  overdue: "border-red-400 bg-red-50 dark:bg-red-950/40",
  completed: "border-green-400 bg-green-50 dark:bg-green-950/40 opacity-60",
};

const STATUS_NAME: Record<string, string> = {
  pending: "text-foreground",
  overdue: "text-red-700 dark:text-red-300",
  completed: "text-muted-foreground line-through",
};

export interface WeeklyTask {
  id: string;
  occurrence_id: string;
  name: string;
  description: string | null;
  category: string | null;
  priority: string;
  occurrence_due_date: string;
  due_time: string | null;
  status: string;
}

export interface WeeklyCalendarViewProps {
  currentDate: Date;
  onWeekChange: (date: Date) => void;
  tasks: WeeklyTask[];
  onTaskClick?: (task: WeeklyTask) => void;
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay()); // back to Sunday
  return d;
}

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function buildWeekHeader(weekStart: Date, weekEnd: Date): string {
  const startDay = weekStart.getDate();
  const endDay = weekEnd.getDate();
  const year = weekEnd.getFullYear();

  const startMonth = weekStart.toLocaleDateString("pt-BR", { month: "short" });
  const endMonth = weekEnd.toLocaleDateString("pt-BR", { month: "short" });

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace(".", "");

  if (weekStart.getMonth() === weekEnd.getMonth()) {
    return `${startDay}–${endDay} de ${capitalize(startMonth)} ${year}`;
  }
  return `${startDay} ${capitalize(startMonth)} – ${endDay} ${capitalize(endMonth)} ${year}`;
}

export function WeeklyCalendarView({
  currentDate,
  onWeekChange,
  tasks,
  onTaskClick,
}: WeeklyCalendarViewProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekStart = getWeekStart(currentDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });
  const weekEnd = weekDays[6];

  const tasksByDate = new Map<string, WeeklyTask[]>();
  for (const task of tasks) {
    const key = task.occurrence_due_date;
    if (!tasksByDate.has(key)) tasksByDate.set(key, []);
    tasksByDate.get(key)!.push(task);
  }
  for (const [key, dayTasks] of tasksByDate) {
    tasksByDate.set(
      key,
      [...dayTasks].sort((a, b) => {
        if (a.due_time && b.due_time) return a.due_time.localeCompare(b.due_time);
        if (a.due_time) return -1;
        if (b.due_time) return 1;
        return a.name.localeCompare(b.name, "pt-BR");
      }),
    );
  }

  function prevWeek() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    onWeekChange(d);
  }

  function nextWeek() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    onWeekChange(d);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={prevWeek} aria-label="Semana anterior">
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <h2 className="text-lg font-semibold">
          {buildWeekHeader(weekStart, weekEnd)}
        </h2>

        <Button variant="outline" size="icon" onClick={nextWeek} aria-label="Próxima semana">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {weekDays.map((day, i) => {
          const key = toDateKey(day);
          const isToday = day.getTime() === today.getTime();
          const dayTasks = tasksByDate.get(key) ?? [];

          return (
            <div key={i} className="flex min-h-[240px] flex-col">
              <div
                className={`border-b pb-2 text-center ${isToday ? "border-primary" : "border-border"}`}
              >
                <p className="text-xs font-medium text-muted-foreground">{WEEKDAY_NAMES[i]}</p>
                <span
                  className={`mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                    isToday
                      ? "bg-primary font-semibold text-primary-foreground"
                      : "text-foreground"
                  }`}
                >
                  {day.getDate()}
                </span>
              </div>

              <div className="flex-1 space-y-1 overflow-y-auto pt-1.5">
                {dayTasks.map((task) => (
                  <div
                    key={task.occurrence_id}
                    onClick={() => onTaskClick?.(task)}
                    className={`rounded border-l-2 px-2 py-1.5 text-xs ${STATUS_CARD[task.status] ?? "border-muted bg-muted"} ${
                      onTaskClick ? "cursor-pointer transition-opacity hover:opacity-75" : ""
                    }`}
                  >
                    <p className={`font-medium leading-snug ${STATUS_NAME[task.status] ?? ""}`}>
                      {task.name}
                    </p>

                    {task.due_time && (
                      <p className="mt-0.5 text-muted-foreground">{task.due_time.slice(0, 5)}</p>
                    )}

                    {task.description && (
                      <p className="mt-0.5 line-clamp-2 text-muted-foreground">
                        {task.description}
                      </p>
                    )}

                    {task.category && (
                      <Badge variant="secondary" className="mt-1 h-4 px-1 text-[10px]">
                        {task.category}
                      </Badge>
                    )}
                  </div>
                ))}

                {dayTasks.length === 0 && (
                  <p className="px-1 pt-1 text-center text-[11px] text-muted-foreground/50">—</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
