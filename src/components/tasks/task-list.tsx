import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { TaskItem } from "./task-item";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  completed: boolean;
  completed_at: string | null;
  status: string;
  overdue_days: number | null;
}

interface TaskListProps {
  onEditTask: (task: TaskData) => void;
  refreshKey: number;
}

export function TaskList({ onEditTask, refreshKey }: TaskListProps) {
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("due_date");
  const [categories, setCategories] = useState<string[]>([]);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const result = await invoke<TaskData[]>("get_tasks", {
        filter: filter === "all" ? null : filter,
        category: categoryFilter === "all" ? null : categoryFilter,
        priority: priorityFilter === "all" ? null : priorityFilter,
        sortBy: sortBy === "due_date" ? null : sortBy,
      });
      setTasks(result);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    } finally {
      setLoading(false);
    }
  }, [filter, categoryFilter, priorityFilter, sortBy]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks, refreshKey]);

  useEffect(() => {
    invoke<string[]>("get_categories")
      .then(setCategories)
      .catch(() => setCategories([]));
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Select value={filter} onValueChange={(v) => v && setFilter(v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="overdue">Atrasadas</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={(v) => v && setCategoryFilter(v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={(v) => v && setPriorityFilter(v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Prioridades</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="medium">Média</SelectItem>
            <SelectItem value="low">Baixa</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(v) => v && setSortBy(v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="due_date">Data</SelectItem>
            <SelectItem value="priority">Prioridade</SelectItem>
            <SelectItem value="name">Nome</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-lg font-medium text-muted-foreground">
            Nenhuma tarefa encontrada
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Crie sua primeira tarefa clicando no botão acima!
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskItem
              key={task.occurrence_id}
              task={task}
              onComplete={fetchTasks}
              onClick={() => onEditTask(task)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
