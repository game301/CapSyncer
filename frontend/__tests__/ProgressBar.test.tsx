import { render, screen } from "@testing-library/react";
import { ProgressBar } from "../components/ProgressBar";

describe("ProgressBar Component", () => {
  it("should render with percentage", () => {
    const { container } = render(<ProgressBar percentage={50} />);
    const progressFill = container.querySelector('[style*="width"]');
    expect(progressFill).toHaveStyle({ width: "50%" });
  });

  it("should display 0%", () => {
    const { container } = render(<ProgressBar percentage={0} />);
    const progressFill = container.querySelector('[style*="width"]');
    expect(progressFill).toHaveStyle({ width: "0%" });
  });

  it("should display 100%", () => {
    const { container } = render(<ProgressBar percentage={100} />);
    const progressFill = container.querySelector('[style*="width"]');
    expect(progressFill).toHaveStyle({ width: "100%" });
  });

  it("should handle percentages over 100%", () => {
    const { container } = render(<ProgressBar percentage={150} />);
    const progressFill = container.querySelector('[style*="width"]');
    // Component caps display at 100%
    expect(progressFill).toHaveStyle({ width: "100%" });
  });

  it("should apply auto color (green) for low percentage", () => {
    const { container } = render(
      <ProgressBar percentage={50} variant="auto" />,
    );
    const progressFill = container.querySelector(".bg-green-500");
    expect(progressFill).toBeInTheDocument();
  });

  it("should apply auto color (yellow) for medium percentage", () => {
    const { container } = render(
      <ProgressBar percentage={85} variant="auto" />,
    );
    const progressFill = container.querySelector(".bg-yellow-500");
    expect(progressFill).toBeInTheDocument();
  });

  it("should apply auto color (red) for high percentage", () => {
    const { container } = render(
      <ProgressBar percentage={110} variant="auto" />,
    );
    const progressFill = container.querySelector(".bg-red-500");
    expect(progressFill).toBeInTheDocument();
  });

  it("should apply green variant", () => {
    const { container } = render(
      <ProgressBar percentage={75} variant="green" />,
    );
    const progressFill = container.querySelector(".bg-green-500");
    expect(progressFill).toBeInTheDocument();
  });

  it("should apply blue variant", () => {
    const { container } = render(
      <ProgressBar percentage={75} variant="blue" />,
    );
    const progressFill = container.querySelector(".bg-blue-500");
    expect(progressFill).toBeInTheDocument();
  });

  it("should apply red variant", () => {
    const { container } = render(<ProgressBar percentage={75} variant="red" />);
    const progressFill = container.querySelector(".bg-red-500");
    expect(progressFill).toBeInTheDocument();
  });

  it("should show details when enabled", () => {
    render(
      <ProgressBar
        percentage={50}
        showDetails={true}
        current={20}
        total={40}
        unit="h"
      />,
    );
    expect(screen.getByText(/20.*h/)).toBeInTheDocument();
    expect(screen.getByText(/40.*h/)).toBeInTheDocument();
  });

  it("should handle custom currentLabel", () => {
    render(
      <ProgressBar
        percentage={50}
        showDetails={true}
        current={5}
        total={10}
        currentLabel="completed"
      />,
    );
    expect(screen.getByText(/completed/)).toBeInTheDocument();
  });

  it("should cap visual width at 100%", () => {
    const { container } = render(<ProgressBar percentage={150} />);
    const progressFill = container.querySelector('[style*="width"]');
    expect(progressFill).toHaveStyle({ width: "100%" });
  });

  it("should apply custom className", () => {
    const { container } = render(
      <ProgressBar percentage={50} className="custom-class" />,
    );
    const progressContainer = container.firstChild;
    expect(progressContainer).toHaveClass("custom-class");
  });

  it("should use custom width class", () => {
    const { container } = render(<ProgressBar percentage={50} width="w-32" />);
    // Width class is applied to the inner progress bar background div
    const progressBackground = container.querySelector(".bg-slate-700");
    expect(progressBackground).toHaveClass("w-32");
  });
});
