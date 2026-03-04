import { render, screen } from "@testing-library/react";
import { Navbar } from "../components/Navbar";
import { PermissionProvider } from "../contexts/PermissionContext";

// Mock next/link
jest.mock("next/link", () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

// Wrapper component with PermissionProvider
const renderWithProvider = (ui: React.ReactElement) => {
  return render(<PermissionProvider>{ui}</PermissionProvider>);
};

describe("Navbar Component", () => {
  it("renders logo text", () => {
    renderWithProvider(<Navbar />);
    expect(screen.getByText("CS")).toBeInTheDocument();
  });

  it("renders navigation links", () => {
    renderWithProvider(<Navbar />);

    const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
    expect(dashboardLink).toBeInTheDocument();
    expect(dashboardLink).toHaveAttribute("href", "/dashboard");
  });

  it("has correct styling classes", () => {
    const { container } = renderWithProvider(<Navbar />);
    const nav = container.querySelector("nav");

    expect(nav).toHaveClass("sticky", "top-0", "z-50");
  });

  it("contains logo that links to home", () => {
    renderWithProvider(<Navbar />);

    const logoLink = screen.getByText("CS").closest("a");
    expect(logoLink).toHaveAttribute("href", "/");
  });
});
