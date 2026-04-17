import { invoke } from "@tauri-apps/api/core";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface TaskItemProps {
  task: {
    id: string;
    name: string;
    description: string | null;
    category: string | null;
    priority: string;
    due_date: string;
    due_time: string | null;
    recurrence_type: string;
    occurrence_id: string;
    occurrence_due_date: string;
    completed: boolean;
    status: string;
    overdue_days: number | null;
  };
  onComplete: () => void;
  onClick: () => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

const PRIORITY_LABELS: Record<string, string> = {
  high: "Alta",
  medium: "Média",
  low: "Baixa",
};

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

export function TaskItem({ task, onComplete, onClick }: TaskItemProps) {
  async function handleComplete(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await invoke("complete_task", { occurrenceId: task.occurrence_id });
      invoke("refresh_tray_badge").catch(() => {});
      toast.success(`"${task.name}" concluída!`);
      onComplete();
    } catch (err) {
      toast.error(`Erro ao concluir: ${err}`);
    }
  }

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 cursor-pointer"
    >
      <button
        onClick={handleComplete}
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          task.completed
            ? "border-green-500 bg-green-500 text-white"
            : task.status === "overdue"
              ? "border-red-400 hover:bg-red-50 dark:hover:bg-red-950"
              : "border-muted-foreground/30 hover:bg-muted"
        }`}
        disabled={task.completed}
      >
        {task.completed && (
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium truncate ${task.completed ? "line-through text-muted-foreground" : ""}`}>
            {task.name}
          </span>
          {task.recurrence_type !== "none" && (
            <span className="text-xs text-muted-foreground">🔄</span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-1">
          <span className={`text-xs ${task.status === "overdue" ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
            {task.status === "overdue"
              ? `Atrasada há ${task.overdue_days} dias — desde ${formatDate(task.occurrence_due_date)}`
              : formatDate(task.occurrence_due_date)}
            {task.due_time && ` às ${task.due_time.slice(0, 5)}`}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {task.category && (
          <Badge variant="secondary" className="text-xs">
            {task.category}
          </Badge>
        )}
        <Badge className={`text-xs ${PRIORITY_COLORS[task.priority] || ""}`}>
          {PRIORITY_LABELS[task.priority] || task.priority}
        </Badge>
      </div>
    </div>
  );
}
