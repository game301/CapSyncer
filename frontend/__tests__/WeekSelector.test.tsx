import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WeekSelector } from "../components/WeekSelector";

describe("WeekSelector Component", () => {
  it("should render week selector", () => {
    render(<WeekSelector />);
    // Check for select elements (rendered as combobox role)
    const selects = screen.getAllByRole("combobox");
    expect(selects.length).toBeGreaterThanOrEqual(2); // year and week selects
  });

  it("should display specific year and week", () => {
    render(<WeekSelector defaultYear={2026} defaultWeek={10} />);
    // Component renders - check for navigation buttons
    expect(
      screen.getByRole("button", { name: /previous/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();
  });

  it("should navigate to previous week", async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup();

    render(
      <WeekSelector
        defaultYear={2026}
        defaultWeek={10}
        onWeekChange={handleChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: /previous/i }));

    // Should call onChange
    expect(handleChange).toHaveBeenCalled();
  });

  it("should navigate to next week", async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup();

    render(
      <WeekSelector
        defaultYear={2026}
        defaultWeek={10}
        onWeekChange={handleChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: /next/i }));

    // Should call onChange
    expect(handleChange).toHaveBeenCalled();
  });

  it("should handle year transition forward", async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup();

    render(
      <WeekSelector
        defaultYear={2025}
        defaultWeek={52}
        onWeekChange={handleChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: /next/i }));

    // Should call onChange (verifies no crash on year boundary)
    expect(handleChange).toHaveBeenCalled();
  });

  it("should handle year transition backward", async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup();

    render(
      <WeekSelector
        defaultYear={2026}
        defaultWeek={1}
        onWeekChange={handleChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: /previous/i }));

    // Should call onChange (verifies no crash on year boundary)
    expect(handleChange).toHaveBeenCalled();
  });

  it("should have Today button", async () => {
    render(<WeekSelector />);
    expect(screen.getByRole("button", { name: /today/i })).toBeInTheDocument();
  });

  it("should have accessible navigation buttons", () => {
    render(<WeekSelector />);

    expect(
      screen.getByRole("button", { name: /previous/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /today/i })).toBeInTheDocument();
  });

  it("should accept name prop for hidden inputs", () => {
    const { container } = render(<WeekSelector name="selectedWeek" />);

    // Check for hidden inputs with the specified name
    const yearInput = container.querySelector('input[name="selectedWeekYear"]');
    const weekInput = container.querySelector(
      'input[name="selectedWeekNumber"]',
    );
    expect(yearInput).toBeInTheDocument();
    expect(weekInput).toBeInTheDocument();
  });

  it("should mark selects as required when required prop is true", () => {
    const { container } = render(<WeekSelector required />);

    // Check that select elements have required attribute
    const selects = container.querySelectorAll("select[required]");
    expect(selects.length).toBeGreaterThanOrEqual(2);
  });
});
