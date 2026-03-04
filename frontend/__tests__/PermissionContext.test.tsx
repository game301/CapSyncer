import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  PermissionProvider,
  usePermissions,
} from "../contexts/PermissionContext";

// Test component to access context
function TestComponent() {
  const { role, userName, setRole, setUserName } = usePermissions();

  return (
    <div>
      <div data-testid="role">{role}</div>
      <div data-testid="name">{userName}</div>
      <button onClick={() => setRole("admin")}>Set Admin</button>
      <button onClick={() => setUserName("Test User")}>Set Name</button>
    </div>
  );
}

describe("Permission Context", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should provide default values", () => {
    render(
      <PermissionProvider>
        <TestComponent />
      </PermissionProvider>,
    );

    expect(screen.getByTestId("role")).toHaveTextContent("user");
    expect(screen.getByTestId("name")).toHaveTextContent("");
  });

  it("should update role", async () => {
    const user = userEvent.setup();

    render(
      <PermissionProvider>
        <TestComponent />
      </PermissionProvider>,
    );

    await user.click(screen.getByText("Set Admin"));
    expect(screen.getByTestId("role")).toHaveTextContent("admin");
  });

  it("should persist role to localStorage", async () => {
    const user = userEvent.setup();

    render(
      <PermissionProvider>
        <TestComponent />
      </PermissionProvider>,
    );

    await user.click(screen.getByText("Set Admin"));
    expect(localStorage.getItem("userRole")).toBe("admin");
  });

  it("should update userName", async () => {
    const user = userEvent.setup();

    render(
      <PermissionProvider>
        <TestComponent />
      </PermissionProvider>,
    );

    await user.click(screen.getByText("Set Name"));
    expect(screen.getByTestId("name")).toHaveTextContent("Test User");
  });

  it("should persist userName to localStorage", async () => {
    const user = userEvent.setup();

    render(
      <PermissionProvider>
        <TestComponent />
      </PermissionProvider>,
    );

    await user.click(screen.getByText("Set Name"));
    expect(localStorage.getItem("userName")).toBe("Test User");
  });

  it("should throw error when used outside provider", () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    expect(() => {
      render(<TestComponent />);
    }).toThrow();

    consoleSpy.mockRestore();
  });
});
