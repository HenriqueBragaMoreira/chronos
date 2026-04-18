import { useState, useEffect, useCallback, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Toaster } from "sonner";
import { MonthlyCalendarView } from "@/components/calendar/monthly-calendar-view";
import { WeeklyCalendarView, type WeeklyTask } from "@/components/calendar/weekly-calendar-view";
import { TaskForm } from "@/components/tasks/task-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface TaskData {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  priority: string;
  due_date: string;
  due_time: string | null;
  recurrence_type: string;
  recurrence_value: number | null;
  occurrence_id: string;
  occurrence_due_date: string;
  status: string;
}

const STATUS_DOT: Record<string, string> = {
  pending: "bg-blue-400",
  overdue: "bg-red-400",
  completed: "bg-green-400",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  overdue: "Atrasada",
  completed: "Concluída",
};

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getMonthRange(date: Date): { start: string; end: string } {
  const y = date.getFullYear();
  const m = date.getMonth();
  const start = `${y}-${String(m + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(y, m + 1, 0).getDate();
  const end = `${y}-${String(m + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

function getWeekRange(date: Date): { start: string; end: string } {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay()); // back to Sunday
  const end = new Date(d);
  end.setDate(d.getDate() + 6);
  return { start: toDateKey(d), end: toDateKey(end) };
}

export default function CalendarPage() {
  const [view, setView] = useState<"monthly" | "weekly">("monthly");
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [weekDate, setWeekDate] = useState(() => new Date());
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskData | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchTasks = useCallback(async (start: string, end: string) => {
    try {
      const result = await invoke<TaskData[]>("get_tasks_by_date_range", {
        startDate: start,
        endDate: end,
      });
      setTasks(result);
    } catch (err) {
      console.error("Erro ao buscar tarefas:", err);
    }
  }, []);

  useEffect(() => {
    const range =
      view === "monthly" ? getMonthRange(currentDate) : getWeekRange(weekDate);
    fetchTasks(range.start, range.end);
  }, [view, currentDate, weekDate, fetchTasks, refreshKey]);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, TaskData[]>();
    for (const task of tasks) {
      const key = task.occurrence_due_date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(task);
    }
    return map;
  }, [tasks]);

  const taskByOccurrenceId = useMemo(
    () => new Map(tasks.map((t) => [t.occurrence_id, t])),
    [tasks],
  );

  const weeklyTasks = useMemo<WeeklyTask[]>(
    () =>
      tasks.map((t) => ({
        id: t.id,
        occurrence_id: t.occurrence_id,
        name: t.name,
        description: t.description,
        category: t.category,
        priority: t.priority,
        occurrence_due_date: t.occurrence_due_date,
        due_time: t.due_time,
        status: t.status,
      })),
    [tasks],
  );

  const selectedDateTasks = useMemo(
    () => (selectedDate ? (tasksByDate.get(toDateKey(selectedDate)) ?? []) : []),
    [selectedDate, tasksByDate],
  );

  function renderDayContent(date: Date) {
    const dayTasks = tasksByDate.get(toDateKey(date));
    if (!dayTasks?.length) return null;

    const visible = dayTasks.slice(0, 3);
    const overflow = dayTasks.length - visible.length;

    return (
      <div className="flex flex-wrap items-center gap-0.5">
        {visible.map((t) => (
          <span
            key={t.occurrence_id}
            className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${STATUS_DOT[t.status] ?? "bg-muted-foreground"}`}
          />
        ))}
        {overflow > 0 && (
          <span className="text-[10px] leading-none text-muted-foreground">+{overflow}</span>
        )}
      </div>
    );
  }

  function handleDayClick(date: Date) {
    const key = toDateKey(date);
    if (selectedDate && toDateKey(selectedDate) === key) {
      setSelectedDate(null);
    } else {
      setSelectedDate(date);
    }
  }

  function handleTaskClick(wt: WeeklyTask | TaskData) {
    const full = taskByOccurrenceId.get(wt.occurrence_id);
    if (full) {
      setEditingTask(full);
      setFormOpen(true);
    }
  }

  function handleFormSuccess() {
    invoke("refresh_tray_badge").catch(() => {});
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Calendário</h1>
        <div className="flex rounded-md border">
          <Button
            variant={view === "monthly" ? "default" : "ghost"}
            size="sm"
            className="rounded-r-none"
            onClick={() => {
              setView("monthly");
              setSelectedDate(null);
            }}
          >
            Mensal
          </Button>
          <Button
            variant={view === "weekly" ? "default" : "ghost"}
            size="sm"
            className="rounded-l-none border-l"
            onClick={() => setView("weekly")}
          >
            Semanal
          </Button>
        </div>
      </div>

      {view === "monthly" && (
        <section>
          <MonthlyCalendarView
            currentDate={currentDate}
            onMonthChange={(date) => {
              setCurrentDate(date);
              setSelectedDate(null);
            }}
            onDayClick={handleDayClick}
            renderDayContent={renderDayContent}
          />

          {selectedDate && (
            <div className="mt-4 space-y-3 rounded-lg border p-4">
              <h2 className="font-semibold">
                {selectedDate.toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </h2>

              {selectedDateTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma tarefa neste dia.</p>
              ) : (
                <ul className="space-y-2">
                  {selectedDateTasks.map((task) => (
                    <li
                      key={task.occurrence_id}
                      onClick={() => handleTaskClick(task)}
                      className="flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm transition-colors hover:bg-muted/50"
                    >
                      <span
                        className={`h-2 w-2 flex-shrink-0 rounded-full ${STATUS_DOT[task.status] ?? "bg-muted-foreground"}`}
                      />
                      <span className="flex-1 font-medium">{task.name}</span>
                      {task.due_time && (
                        <span className="text-xs text-muted-foreground">
                          {task.due_time.slice(0, 5)}
                        </span>
                      )}
                      {task.category && (
                        <Badge variant="secondary" className="text-xs">
                          {task.category}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {STATUS_LABEL[task.status] ?? task.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>
      )}

      {view === "weekly" && (
        <section>
          <WeeklyCalendarView
            currentDate={weekDate}
            onWeekChange={setWeekDate}
            tasks={weeklyTasks}
            onTaskClick={handleTaskClick}
          />
        </section>
      )}

      <TaskForm
        open={formOpen}
        onOpenChange={setFormOpen}
        task={editingTask}
        onSuccess={handleFormSuccess}
      />

      <Toaster position="bottom-right" richColors />
    </div>
  );
}
