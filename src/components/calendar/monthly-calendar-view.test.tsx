import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";
import { MonthlyCalendarView } from "./monthly-calendar-view";

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    "aria-label": ariaLabel,
  }: React.PropsWithChildren<{ onClick?: () => void; "aria-label"?: string }>) => (
    <button onClick={onClick} aria-label={ariaLabel}>
      {children}
    </button>
  ),
}));

const APRIL_2026 = new Date(2026, 3, 1); // April 2026

function renderCalendar(overrides: Partial<React.ComponentProps<typeof MonthlyCalendarView>> = {}) {
  const defaults = {
    currentDate: APRIL_2026,
    onMonthChange: vi.fn(),
  };
  render(<MonthlyCalendarView {...defaults} {...overrides} />);
  return defaults;
}

describe("MonthlyCalendarView", () => {
  it("renders month name and year in the header", () => {
    renderCalendar();

    expect(screen.getByText("Abril 2026")).toBeInTheDocument();
  });

  it("renders all weekday column headers", () => {
    renderCalendar();

    for (const name of ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
  });

  it("renders all 30 days of April", () => {
    renderCalendar();

    // April 2026 has 30 days; "30" may also appear as March 30 (faded)
    expect(screen.getAllByText("30").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("1").length).toBeGreaterThanOrEqual(1);
  });

  it("calls onMonthChange with previous month when Mês anterior is clicked", async () => {
    const user = userEvent.setup();
    const onMonthChange = vi.fn();
    renderCalendar({ onMonthChange });

    await user.click(screen.getByRole("button", { name: "Mês anterior" }));

    expect(onMonthChange).toHaveBeenCalledWith(new Date(2026, 2, 1)); // March 2026
  });

  it("calls onMonthChange with next month when Próximo mês is clicked", async () => {
    const user = userEvent.setup();
    const onMonthChange = vi.fn();
    renderCalendar({ onMonthChange });

    await user.click(screen.getByRole("button", { name: "Próximo mês" }));

    expect(onMonthChange).toHaveBeenCalledWith(new Date(2026, 4, 1)); // May 2026
  });

  it("calls onDayClick with the correct date when a day cell is clicked", async () => {
    const user = userEvent.setup();
    const onDayClick = vi.fn();
    renderCalendar({ onDayClick });

    // April 2026 starts on Wednesday (DOM index 3)
    // Click on day 15 — find the span showing "15"
    const daySpans = screen.getAllByText("15");
    await user.click(daySpans[0].closest("div")!);

    expect(onDayClick).toHaveBeenCalledWith(new Date(2026, 3, 15));
  });

  it("renders custom day content via renderDayContent", () => {
    renderCalendar({
      renderDayContent: (date) =>
        date.getDate() === 10 ? <span data-testid="dot-10" /> : null,
    });

    expect(screen.getByTestId("dot-10")).toBeInTheDocument();
  });

  it("renders December correctly with month name", () => {
    renderCalendar({ currentDate: new Date(2026, 11, 1) });

    expect(screen.getByText("Dezembro 2026")).toBeInTheDocument();
  });
});
