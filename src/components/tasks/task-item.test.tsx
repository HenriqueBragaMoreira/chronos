import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { toast } from "sonner";
import { invoke } from "@tauri-apps/api/core";
import { TaskItem } from "./task-item";

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() }, Toaster: () => null }));

const mockInvoke = vi.mocked(invoke);
const mockToastSuccess = vi.mocked(toast.success);

const PENDING_TASK = {
  id: "t1",
  name: "Limpar banheiro",
  description: null,
  category: "Limpeza",
  priority: "high",
  due_date: "2026-04-21",
  due_time: null,
  recurrence_type: "none",
  occurrence_id: "occ-1",
  occurrence_due_date: "2026-04-21",
  completed: false,
  status: "pending",
  overdue_days: null,
};

const OVERDUE_TASK = {
  ...PENDING_TASK,
  id: "t2",
  occurrence_id: "occ-2",
  occurrence_due_date: "2026-04-15",
  status: "overdue",
  overdue_days: 6,
};

const COMPLETED_TASK = {
  ...PENDING_TASK,
  id: "t3",
  occurrence_id: "occ-3",
  completed: true,
  status: "completed",
};

describe("TaskItem", () => {
  const onComplete = vi.fn();
  const onClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockInvoke.mockResolvedValue(undefined);
  });

  it("renders task name, category badge and priority badge", () => {
    render(<TaskItem task={PENDING_TASK} onComplete={onComplete} onClick={onClick} />);

    expect(screen.getByText("Limpar banheiro")).toBeInTheDocument();
    expect(screen.getByText("Limpeza")).toBeInTheDocument();
    expect(screen.getByText("Alta")).toBeInTheDocument();
  });

  it("renders formatted date for pending task", () => {
    render(<TaskItem task={PENDING_TASK} onComplete={onComplete} onClick={onClick} />);

    expect(screen.getByText("21/04/2026")).toBeInTheDocument();
  });

  it("shows overdue message with correct days and date", () => {
    render(<TaskItem task={OVERDUE_TASK} onComplete={onComplete} onClick={onClick} />);

    expect(
      screen.getByText(/atrasada há 6 dias — desde 15\/04\/2026/i),
    ).toBeInTheDocument();
  });

  it("calls complete_task and onComplete on checkbox click", async () => {
    const user = userEvent.setup();
    render(<TaskItem task={PENDING_TASK} onComplete={onComplete} onClick={onClick} />);

    const checkbox = screen.getByRole("button", { name: "" });
    await user.click(checkbox);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("complete_task", {
        occurrenceId: "occ-1",
      });
    });

    expect(onComplete).toHaveBeenCalled();
    expect(mockToastSuccess).toHaveBeenCalledWith('"Limpar banheiro" concluída!');
  });

  it("disables checkbox when task is completed", () => {
    render(<TaskItem task={COMPLETED_TASK} onComplete={onComplete} onClick={onClick} />);

    const checkbox = screen.getByRole("button");
    expect(checkbox).toBeDisabled();
  });

  it("applies line-through style when task is completed", () => {
    render(<TaskItem task={COMPLETED_TASK} onComplete={onComplete} onClick={onClick} />);

    const name = screen.getByText("Limpar banheiro");
    expect(name).toHaveClass("line-through");
  });

  it("calls onClick when card is clicked", async () => {
    const user = userEvent.setup();
    render(<TaskItem task={PENDING_TASK} onComplete={onComplete} onClick={onClick} />);

    await user.click(screen.getByText("Limpar banheiro"));

    expect(onClick).toHaveBeenCalled();
  });
});
