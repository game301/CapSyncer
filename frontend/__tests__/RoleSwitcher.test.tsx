import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RoleSwitcher } from "../components/RoleSwitcher";
import { PermissionProvider } from "../contexts/PermissionContext";

describe("RoleSwitcher Component", () => {
  const renderWithProvider = (component: React.ReactElement) => {
    return render(<PermissionProvider>{component}</PermissionProvider>);
  };

  beforeEach(() => {
    localStorage.clear();
  });

  it("renders role switcher with default role", () => {
    renderWithProvider(<RoleSwitcher />);

    // Should show both User and Admin buttons
    expect(screen.getByText("User")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("allows switching between roles", async () => {
    const user = userEvent.setup();
    renderWithProvider(<RoleSwitcher />);

    // Click Admin button
    const adminButton = screen.getByRole("button", { name: /admin/i });
    await user.click(adminButton);

    // Verify role changed in localStorage
    expect(localStorage.getItem("userRole")).toBe("admin");
  });

  it("persists role selection across re-renders", () => {
    localStorage.setItem("userRole", "admin");

    renderWithProvider(<RoleSwitcher />);

    // Both buttons should still be visible
    expect(screen.getByText("User")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });
});
