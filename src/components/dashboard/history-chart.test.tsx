import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import { HistoryChart } from "./history-chart";

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));

vi.mock("recharts", () => ({
  BarChart: ({ children }: React.PropsWithChildren) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ResponsiveContainer: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

const mockInvoke = vi.mocked(invoke);

const HISTORY_DATA = [
  { period: "2026-03", completed: 10, pending: 2 },
  { period: "2026-04", completed: 15, pending: 3 },
];

describe("HistoryChart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInvoke.mockResolvedValue(HISTORY_DATA);
  });

  it("shows empty state when no data is returned", async () => {
    mockInvoke.mockResolvedValue([]);
    render(<HistoryChart />);

    await waitFor(() => {
      expect(screen.getByText(/sem histórico/i)).toBeInTheDocument();
    });
  });

  it("renders chart when data is present", async () => {
    render(<HistoryChart />);

    await waitFor(() => {
      expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
    });
  });

  it("calls get_history with granularity=week when Semanas is clicked", async () => {
    const user = userEvent.setup();
    render(<HistoryChart />);

    await waitFor(() => screen.getByTestId("bar-chart"));

    await user.click(screen.getByRole("button", { name: "Semanas" }));

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("get_history", { granularity: "week" });
    });
  });

  it("calls get_history with granularity=month by default", async () => {
    render(<HistoryChart />);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("get_history", { granularity: "month" });
    });
  });
});
