import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import { CompletionRateCard } from "./completion-rate-card";

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));

const mockInvoke = vi.mocked(invoke);

const RATE_DATA = { on_time: 8, late: 2, missed: 1, rate: 72.7 };

describe("CompletionRateCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInvoke.mockResolvedValue(RATE_DATA);
  });

  it("renders rounded rate percentage", async () => {
    render(<CompletionRateCard />);

    await waitFor(() => {
      expect(screen.getByText("73%")).toBeInTheDocument();
    });
  });

  it("renders on_time, late and missed counts", async () => {
    render(<CompletionRateCard />);

    await waitFor(() => {
      expect(screen.getByText("8")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("1")).toBeInTheDocument();
    });
  });

  it("shows 0% when all values are zero", async () => {
    mockInvoke.mockResolvedValue({ on_time: 0, late: 0, missed: 0, rate: 0 });

    render(<CompletionRateCard />);

    await waitFor(() => {
      expect(screen.getByText("0%")).toBeInTheDocument();
    });
  });

  it("calls get_completion_rate with period=week when Semana is clicked", async () => {
    const user = userEvent.setup();
    render(<CompletionRateCard />);

    await waitFor(() => screen.getByText("73%"));

    await user.click(screen.getByRole("button", { name: "Semana" }));

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("get_completion_rate", { period: "week" });
    });
  });

  it("calls get_completion_rate with period=year when Ano is clicked", async () => {
    const user = userEvent.setup();
    render(<CompletionRateCard />);

    await waitFor(() => screen.getByText("73%"));

    await user.click(screen.getByRole("button", { name: "Ano" }));

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("get_completion_rate", { period: "year" });
    });
  });
});
