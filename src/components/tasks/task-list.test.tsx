import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import { TaskList } from "./task-list";

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));

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

vi.mock("./task-item", () => ({
  TaskItem: ({
    task,
    onClick,
  }: {
    task: { occurrence_id: string; name: string };
    onClick: () => void;
  }) => (
    <div data-testid="task-item" onClick={onClick}>
      {task.name}
    </div>
  ),
}));

const mockInvoke = vi.mocked(invoke);

const TASKS = [
  {
    id: "t1",
    name: "Lavar louça",
    description: null,
    category: "Cozinha",
    priority: "high",
    due_date: "2026-04-21",
    due_time: null,
    recurrence_type: "none",
    recurrence_value: null,
    occurrence_id: "occ-1",
    occurrence_due_date: "2026-04-21",
    completed: false,
    completed_at: null,
    status: "pending",
    overdue_days: null,
  },
  {
    id: "t2",
    name: "Varrer sala",
    description: null,
    category: "Sala",
    priority: "medium",
    due_date: "2026-04-21",
    due_time: null,
    recurrence_type: "none",
    recurrence_value: null,
    occurrence_id: "occ-2",
    occurrence_due_date: "2026-04-21",
    completed: false,
    completed_at: null,
    status: "pending",
    overdue_days: null,
  },
];

function renderList(refreshKey = 0) {
  render(<TaskList onEditTask={vi.fn()} refreshKey={refreshKey} />);
}

describe("TaskList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInvoke.mockImplementation((cmd) => {
      if (cmd === "get_categories") return Promise.resolve(["Cozinha", "Sala"]);
      if (cmd === "get_tasks") return Promise.resolve(TASKS);
      return Promise.resolve([]);
    });
  });

  it("renders all tasks returned by get_tasks", async () => {
    renderList();

    await waitFor(() => {
      expect(screen.getByText("Lavar louça")).toBeInTheDocument();
      expect(screen.getByText("Varrer sala")).toBeInTheDocument();
    });
  });

  it("shows empty state when no tasks are returned", async () => {
    mockInvoke.mockImplementation((cmd) => {
      if (cmd === "get_categories") return Promise.resolve([]);
      if (cmd === "get_tasks") return Promise.resolve([]);
      return Promise.resolve([]);
    });

    renderList();

    await waitFor(() => {
      expect(screen.getByText(/nenhuma tarefa encontrada/i)).toBeInTheDocument();
    });
  });

  it("calls get_tasks with filter=today when status filter changes", async () => {
    const user = userEvent.setup();
    renderList();

    await waitFor(() => screen.getAllByRole("combobox"));

    const [statusSelect] = screen.getAllByRole("combobox");
    await user.selectOptions(statusSelect, "today");

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith(
        "get_tasks",
        expect.objectContaining({ filter: "today" }),
      );
    });
  });

  it("calls get_tasks with priority=high when priority filter changes", async () => {
    const user = userEvent.setup();
    renderList();

    await waitFor(() => screen.getAllByRole("combobox"));

    const selects = screen.getAllByRole("combobox");
    const prioritySelect = selects[2];
    await user.selectOptions(prioritySelect, "high");

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith(
        "get_tasks",
        expect.objectContaining({ priority: "high" }),
      );
    });
  });

  it("calls get_tasks with sortBy=priority when sort changes", async () => {
    const user = userEvent.setup();
    renderList();

    await waitFor(() => screen.getAllByRole("combobox"));

    const selects = screen.getAllByRole("combobox");
    const sortSelect = selects[3];
    await user.selectOptions(sortSelect, "priority");

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith(
        "get_tasks",
        expect.objectContaining({ sortBy: "priority" }),
      );
    });
  });

  it("calls onEditTask when a task item is clicked", async () => {
    const user = userEvent.setup();
    const onEditTask = vi.fn();
    render(<TaskList onEditTask={onEditTask} refreshKey={0} />);

    await waitFor(() => screen.getByText("Lavar louça"));

    await user.click(screen.getByText("Lavar louça"));

    expect(onEditTask).toHaveBeenCalledWith(TASKS[0]);
  });

  it("re-fetches tasks when refreshKey changes", async () => {
    const { rerender } = render(<TaskList onEditTask={vi.fn()} refreshKey={0} />);

    await waitFor(() => screen.getAllByTestId("task-item"));

    const callsBefore = mockInvoke.mock.calls.filter((c) => c[0] === "get_tasks").length;

    rerender(<TaskList onEditTask={vi.fn()} refreshKey={1} />);

    await waitFor(() => {
      const callsAfter = mockInvoke.mock.calls.filter((c) => c[0] === "get_tasks").length;
      expect(callsAfter).toBeGreaterThan(callsBefore);
    });
  });
});
