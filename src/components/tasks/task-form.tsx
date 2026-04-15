import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { CategoryCombobox } from "./category-combobox";

interface Task {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  priority: string;
  due_date: string;
  due_time: string | null;
  recurrence_type: string;
  recurrence_value: number | null;
}

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  onSuccess: () => void;
}

const WEEKDAYS = [
  { value: "0", label: "Domingo" },
  { value: "1", label: "Segunda-feira" },
  { value: "2", label: "Terça-feira" },
  { value: "3", label: "Quarta-feira" },
  { value: "4", label: "Quinta-feira" },
  { value: "5", label: "Sexta-feira" },
  { value: "6", label: "Sábado" },
];

export function TaskForm({ open, onOpenChange, task, onSuccess }: TaskFormProps) {
  const isEditing = !!task;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [recurrenceType, setRecurrenceType] = useState("none");
  const [recurrenceValue, setRecurrenceValue] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (task) {
      setName(task.name);
      setDescription(task.description || "");
      setCategory(task.category || "");
      setPriority(task.priority);
      setDueDate(task.due_date);
      setDueTime(task.due_time || "");
      setRecurrenceType(task.recurrence_type);
      setRecurrenceValue(task.recurrence_value?.toString() || "");
    } else {
      setName("");
      setDescription("");
      setCategory("");
      setPriority("medium");
      setDueDate("");
      setDueTime("");
      setRecurrenceType("none");
      setRecurrenceValue("");
    }
  }, [task, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("O nome da tarefa é obrigatório");
      return;
    }
    if (!dueDate) {
      toast.error("A data de vencimento é obrigatória");
      return;
    }
    if (recurrenceType !== "none" && !recurrenceValue) {
      toast.error("O valor de recorrência é obrigatório");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        category: category.trim() || null,
        priority,
        due_date: dueDate,
        due_time: dueTime || null,
        recurrence_type: recurrenceType,
        recurrence_value: recurrenceValue ? parseInt(recurrenceValue) : null,
      };

      if (isEditing) {
        await invoke("update_task", { request: { id: task!.id, ...payload } });
        toast.success("Tarefa atualizada com sucesso");
      } else {
        await invoke("create_task", { request: payload });
        toast.success("Tarefa criada com sucesso");
      }

      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(`Erro: ${err}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Editar Tarefa" : "Nova Tarefa"}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Limpar a cozinha"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes opcionais..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Categoria</Label>
            <CategoryCombobox value={category} onChange={setCategory} />
          </div>

          <div className="space-y-2">
            <Label>Prioridade</Label>
            <Select value={priority} onValueChange={(v) => v && setPriority(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="due_date">Data *</Label>
              <Input
                id="due_date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="due_time">Horário</Label>
              <Input
                id="due_time"
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Recorrência</Label>
            <Select value={recurrenceType} onValueChange={(v) => v && setRecurrenceType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="interval">A cada N dias</SelectItem>
                <SelectItem value="monthly">Mensal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {recurrenceType === "weekly" && (
            <div className="space-y-2">
              <Label>Dia da semana</Label>
              <Select value={recurrenceValue} onValueChange={(v) => v && setRecurrenceValue(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o dia" />
                </SelectTrigger>
                <SelectContent>
                  {WEEKDAYS.map((day) => (
                    <SelectItem key={day.value} value={day.value}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {recurrenceType === "interval" && (
            <div className="space-y-2">
              <Label htmlFor="interval_days">A cada quantos dias?</Label>
              <Input
                id="interval_days"
                type="number"
                min={1}
                value={recurrenceValue}
                onChange={(e) => setRecurrenceValue(e.target.value)}
                placeholder="Ex: 7"
              />
            </div>
          )}

          {recurrenceType === "monthly" && (
            <div className="space-y-2">
              <Label htmlFor="monthly_day">Dia do mês</Label>
              <Input
                id="monthly_day"
                type="number"
                min={1}
                max={31}
                value={recurrenceValue}
                onChange={(e) => setRecurrenceValue(e.target.value)}
                placeholder="Ex: 15"
              />
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Salvando..." : isEditing ? "Salvar Alterações" : "Criar Tarefa"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
