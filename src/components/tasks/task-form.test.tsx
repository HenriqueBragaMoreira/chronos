import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { toast } from "sonner";
import { invoke } from "@tauri-apps/api/core";
import { TaskForm } from "./task-form";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
  Toaster: () => null,
}));

// Radix UI Select does not render correctly in jsdom — replace with native <select>
vi.mock("@/components/ui/select", () => ({
  Select: ({
    value,
    onValueChange,
    children,
  }: React.PropsWithChildren<{ value?: string; onValueChange?: (v: string) => void }>) => (
    <select value={value} onChange={(e) => onValueChange?.(e.target.value)}>
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: React.PropsWithChildren) => <>{children}</>,
  SelectValue: () => null,
  SelectContent: ({ children }: React.PropsWithChildren) => <>{children}</>,
  SelectItem: ({ value, children }: React.PropsWithChildren<{ value: string }>) => (
    <option value={value}>{children}</option>
  ),
}));

const mockInvoke = vi.mocked(invoke);
const mockToastError = vi.mocked(toast.error);
const mockToastSuccess = vi.mocked(toast.success);

const BASE_TASK = {
  id: "abc-123",
  name: "Lavar louça",
  description: "Com sabão neutro",
  category: "Cozinha",
  priority: "medium",
  due_date: "2026-04-25",
  due_time: null,
  recurrence_type: "none",
  recurrence_value: null,
};

function renderForm(task?: typeof BASE_TASK | null) {
  render(
    <TaskForm
      open={true}
      onOpenChange={vi.fn()}
      task={task}
      onSuccess={vi.fn()}
    />,
  );
}

// With the Select mock there are 2 native <select>s: [priority, recurrence]
function getRecurrenceSelect() {
  const selects = screen.getAllByRole("combobox");
  return selects[selects.length - 1];
}

describe("TaskForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInvoke.mockResolvedValue([]);
  });

  describe("validation", () => {
    it("shows error when name is empty on submit", async () => {
      const user = userEvent.setup();
      renderForm();

      await user.click(screen.getByRole("button", { name: /criar tarefa/i }));

      expect(mockToastError).toHaveBeenCalledWith("O nome da tarefa é obrigatório");
    });

    it("shows error when due date is empty on submit", async () => {
      const user = userEvent.setup();
      renderForm();

      await user.type(screen.getByLabelText(/nome/i), "Tarefa teste");
      await user.click(screen.getByRole("button", { name: /criar tarefa/i }));

      expect(mockToastError).toHaveBeenCalledWith("A data de vencimento é obrigatória");
    });

    it("shows error when recurrence value is missing", async () => {
      const user = userEvent.setup();
      renderForm();

      await user.type(screen.getByLabelText(/nome/i), "Tarefa teste");
      await user.type(screen.getByLabelText(/data/i), "2026-04-25");
      await user.selectOptions(getRecurrenceSelect(), "interval");

      await user.click(screen.getByRole("button", { name: /criar tarefa/i }));

      expect(mockToastError).toHaveBeenCalledWith("O valor de recorrência é obrigatório");
    });
  });

  describe("recurrence conditional fields", () => {
    it("shows weekday selector when recurrence type is weekly", async () => {
      const user = userEvent.setup();
      renderForm();

      expect(screen.queryByText(/dia da semana/i)).not.toBeInTheDocument();

      await user.selectOptions(getRecurrenceSelect(), "weekly");

      expect(screen.getByText(/dia da semana/i)).toBeInTheDocument();
    });

    it("shows interval input when recurrence type is interval", async () => {
      const user = userEvent.setup();
      renderForm();

      await user.selectOptions(getRecurrenceSelect(), "interval");

      expect(screen.getByLabelText(/a cada quantos dias/i)).toBeInTheDocument();
    });

    it("shows monthly day input when recurrence type is monthly", async () => {
      const user = userEvent.setup();
      renderForm();

      await user.selectOptions(getRecurrenceSelect(), "monthly");

      expect(screen.getByLabelText(/dia do mês/i)).toBeInTheDocument();
    });

    it("hides recurrence value fields when type is none", () => {
      renderForm();

      expect(screen.queryByText(/dia da semana/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/a cada quantos dias/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/dia do mês/i)).not.toBeInTheDocument();
    });
  });

  describe("creation mode", () => {
    it("renders empty form in creation mode", () => {
      renderForm();

      expect(screen.getByLabelText(/nome/i)).toHaveValue("");
      expect(screen.getByLabelText(/descrição/i)).toHaveValue("");
      expect(screen.getByRole("button", { name: /criar tarefa/i })).toBeInTheDocument();
    });

    it("calls create_task on valid submit", async () => {
      const user = userEvent.setup();
      mockInvoke.mockResolvedValueOnce([]); // get_categories
      mockInvoke.mockResolvedValueOnce({});  // create_task

      renderForm();

      await user.type(screen.getByLabelText(/nome/i), "Nova tarefa");
      await user.type(screen.getByLabelText(/data/i), "2026-04-25");
      await user.click(screen.getByRole("button", { name: /criar tarefa/i }));

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith(
          "create_task",
          expect.objectContaining({
            request: expect.objectContaining({ name: "Nova tarefa" }),
          }),
        );
      });

      expect(mockToastSuccess).toHaveBeenCalledWith("Tarefa criada com sucesso");
    });
  });

  describe("edit mode", () => {
    it("pre-fills all fields with task data", () => {
      renderForm(BASE_TASK);

      expect(screen.getByLabelText(/nome/i)).toHaveValue("Lavar louça");
      expect(screen.getByLabelText(/descrição/i)).toHaveValue("Com sabão neutro");
      expect(screen.getByLabelText(/data/i)).toHaveValue("2026-04-25");
    });

    it("shows edit button label in edit mode", () => {
      renderForm(BASE_TASK);

      expect(screen.getByRole("button", { name: /salvar alterações/i })).toBeInTheDocument();
    });

    it("calls update_task on submit in edit mode", async () => {
      const user = userEvent.setup();
      mockInvoke.mockResolvedValueOnce([]); // get_categories
      mockInvoke.mockResolvedValueOnce({});  // update_task

      renderForm(BASE_TASK);

      await user.clear(screen.getByLabelText(/nome/i));
      await user.type(screen.getByLabelText(/nome/i), "Lavar louça editada");
      await user.click(screen.getByRole("button", { name: /salvar alterações/i }));

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith(
          "update_task",
          expect.objectContaining({
            request: expect.objectContaining({ name: "Lavar louça editada" }),
          }),
        );
      });

      expect(mockToastSuccess).toHaveBeenCalledWith("Tarefa atualizada com sucesso");
    });
  });
});
