import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import { CategoryChart } from "./category-chart";

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

describe("CategoryChart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows empty state when no data is returned", async () => {
    mockInvoke.mockResolvedValue([]);
    render(<CategoryChart />);

    await waitFor(() => {
      expect(screen.getByText(/nenhuma tarefa cadastrada/i)).toBeInTheDocument();
    });
  });

  it("renders chart when data is present", async () => {
    mockInvoke.mockResolvedValue([
      { category: "Cozinha", pending: 3, completed: 5 },
      { category: "Sala", pending: 1, completed: 2 },
    ]);
    render(<CategoryChart />);

    await waitFor(() => {
      expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
    });
  });

  it("renders section heading", async () => {
    mockInvoke.mockResolvedValue([]);
    render(<CategoryChart />);

    await waitFor(() => {
      expect(screen.getByText(/distribuição por categoria/i)).toBeInTheDocument();
    });
  });
});
