import { render, screen } from "@testing-library/react";
import { Footer } from "../components/Footer";

describe("Footer Component", () => {
  it("renders footer sections", () => {
    render(<Footer />);

    expect(screen.getByText("CapSyncer")).toBeInTheDocument();
    expect(screen.getByText("Key Features")).toBeInTheDocument();
    expect(screen.getByText("Built With")).toBeInTheDocument();
  });

  it("renders feature list", () => {
    render(<Footer />);

    expect(screen.getByText("Team capacity tracking")).toBeInTheDocument();
    expect(screen.getByText("Project & task management")).toBeInTheDocument();
    expect(screen.getByText("Real-time analytics")).toBeInTheDocument();
    expect(screen.getByText("Built-in observability")).toBeInTheDocument();
  });

  it("renders company info", () => {
    render(<Footer />);

    expect(
      screen.getByText(/Modern capacity management for teams/i),
    ).toBeInTheDocument();
  });

  it("renders copyright information", () => {
    render(<Footer />);

    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`${currentYear}`))).toBeInTheDocument();
  });

  it("has correct background styling", () => {
    const { container } = render(<Footer />);
    const footer = container.querySelector("footer");

    expect(footer).toHaveClass("border-t", "border-slate-700/50");
  });
});
