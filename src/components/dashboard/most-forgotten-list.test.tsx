import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import { MostForgottenList } from "./most-forgotten-list";

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: React.PropsWithChildren) => <span data-testid="badge">{children}</span>,
}));

const mockInvoke = vi.mocked(invoke);

const FORGOTTEN_DATA = [
  { id: "t1", name: "Limpar banheiro", category: "Limpeza", total: 10, missed: 7, frequency: 70 },
  { id: "t2", name: "Lavar louça", category: null, total: 8, missed: 2, frequency: 25 },
];

describe("MostForgottenList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows empty state when no data is returned", async () => {
    mockInvoke.mockResolvedValue([]);
    render(<MostForgottenList />);

    await waitFor(() => {
      expect(screen.getByText(/nenhuma tarefa recorrente com atrasos/i)).toBeInTheDocument();
    });
  });

  it("renders task names with their ranking positions", async () => {
    mockInvoke.mockResolvedValue(FORGOTTEN_DATA);
    render(<MostForgottenList />);

    await waitFor(() => {
      expect(screen.getByText("Limpar banheiro")).toBeInTheDocument();
      expect(screen.getByText("Lavar louça")).toBeInTheDocument();
      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
    });
  });

  it("renders missed/total counts correctly", async () => {
    mockInvoke.mockResolvedValue(FORGOTTEN_DATA);
    render(<MostForgottenList />);

    await waitFor(() => {
      expect(screen.getByText("7 de 10 vezes")).toBeInTheDocument();
      expect(screen.getByText("2 de 8 vezes")).toBeInTheDocument();
    });
  });

  it("renders category badge when category is present", async () => {
    mockInvoke.mockResolvedValue(FORGOTTEN_DATA);
    render(<MostForgottenList />);

    await waitFor(() => {
      expect(screen.getByText("Limpeza")).toBeInTheDocument();
    });
  });

  it("renders frequency percentage rounded", async () => {
    mockInvoke.mockResolvedValue(FORGOTTEN_DATA);
    render(<MostForgottenList />);

    await waitFor(() => {
      expect(screen.getByText("70%")).toBeInTheDocument();
      expect(screen.getByText("25%")).toBeInTheDocument();
    });
  });
});
