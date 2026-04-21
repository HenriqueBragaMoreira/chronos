import { render, screen, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import { StreakCard } from "./streak-card";

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));

const mockInvoke = vi.mocked(invoke);

describe("StreakCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows current streak count and dias label", async () => {
    mockInvoke.mockResolvedValue({ current: 5, record: 14 });
    render(<StreakCard />);

    await waitFor(() => {
      expect(screen.getByText("5")).toBeInTheDocument();
      expect(screen.getByText("dias")).toBeInTheDocument();
    });
  });

  it("shows dia (singular) when current streak is 1", async () => {
    mockInvoke.mockResolvedValue({ current: 1, record: 3 });
    render(<StreakCard />);

    await waitFor(() => {
      expect(screen.getByText("dia")).toBeInTheDocument();
    });
  });

  it("shows fire emoji when streak is 7 or more", async () => {
    mockInvoke.mockResolvedValue({ current: 10, record: 10 });
    render(<StreakCard />);

    await waitFor(() => {
      expect(screen.getByRole("img", { name: "fogo" })).toHaveTextContent("🔥");
    });
  });

  it("shows lightning emoji when streak is below 7", async () => {
    mockInvoke.mockResolvedValue({ current: 3, record: 5 });
    render(<StreakCard />);

    await waitFor(() => {
      expect(screen.getByRole("img", { name: "fogo" })).toHaveTextContent("⚡");
    });
  });

  it("shows record with trophy emoji", async () => {
    mockInvoke.mockResolvedValue({ current: 5, record: 21 });
    render(<StreakCard />);

    await waitFor(() => {
      expect(screen.getByRole("img", { name: "troféu" })).toBeInTheDocument();
      expect(screen.getByText("21 dias")).toBeInTheDocument();
    });
  });
});
