import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Toaster, toast } from "sonner";
import { TaskForm } from "@/components/tasks/task-form";
import { TaskList } from "@/components/tasks/task-list";

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

export default function TasksPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskData | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<TaskData | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  function handleNewTask() {
    setEditingTask(null);
    setFormOpen(true);
  }

  function handleEditTask(task: TaskData) {
    setEditingTask(task);
    setFormOpen(true);
  }

  function handleRequestDelete() {
    if (editingTask) {
      setTaskToDelete(editingTask);
      setFormOpen(false);
      setDeleteDialogOpen(true);
    }
  }

  async function handleConfirmDelete() {
    if (!taskToDelete) return;
    try {
      await invoke("delete_task", { id: taskToDelete.id });
      invoke("refresh_tray_badge").catch(() => {});
      toast.success(`"${taskToDelete.name}" excluída`);
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(`Erro ao excluir: ${err}`);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Tarefas</h1>
        <Button onClick={handleNewTask}>+ Nova Tarefa</Button>
      </div>

      <TaskList
        onEditTask={handleEditTask}
        onCreateTask={handleNewTask}
        refreshKey={refreshKey}
      />

      <TaskForm
        open={formOpen}
        onOpenChange={setFormOpen}
        task={editingTask}
        onSuccess={() => {
          invoke("refresh_tray_badge").catch(() => {});
          setRefreshKey((k) => k + 1);
        }}
        onDelete={editingTask ? handleRequestDelete : undefined}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogTitle>Excluir tarefa</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir "{taskToDelete?.name}"?
            {taskToDelete?.recurrence_type !== "none" &&
              " Esta é uma tarefa recorrente — ocorrências futuras serão canceladas."}
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster position="bottom-right" richColors />
    </div>
  );
}
