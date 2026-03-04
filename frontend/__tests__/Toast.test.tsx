import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toast } from "../components/Toast";

describe("Toast Component", () => {
  it("should render toast message", () => {
    render(<Toast message="Test message" type="success" />);
    expect(screen.getByText("Test message")).toBeInTheDocument();
  });

  it("should apply success styling", () => {
    const { container } = render(<Toast message="Success" type="success" />);
    const toast = container.querySelector(".bg-green-600");
    expect(toast).toBeInTheDocument();
  });

  it("should apply error styling", () => {
    const { container } = render(<Toast message="Error" type="error" />);
    const toast = container.querySelector(".bg-red-600");
    expect(toast).toBeInTheDocument();
  });

  it("should apply info styling", () => {
    const { container } = render(<Toast message="Info" type="info" />);
    const toast = container.querySelector(".bg-blue-600");
    expect(toast).toBeInTheDocument();
  });

  it("should apply warning styling", () => {
    const { container } = render(<Toast message="Warning" type="warning" />);
    const toast = container.querySelector(".bg-yellow-600");
    expect(toast).toBeInTheDocument();
  });

  it("should call onClose when close button clicked", async () => {
    const handleClose = jest.fn();
    const user = userEvent.setup();

    render(<Toast message="Test" onClose={handleClose} />);

    // Find all buttons and click the close button (it's the only button in Toast)
    const buttons = screen.getAllByRole("button");
    await user.click(buttons[buttons.length - 1]); // Close button is the last one

    // onClose is called after animation delay
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(handleClose).toHaveBeenCalled();
  });

  it("should auto-hide after duration", async () => {
    jest.useFakeTimers();
    const handleClose = jest.fn();

    render(<Toast message="Auto hide" duration={1000} onClose={handleClose} />);

    expect(screen.getByText("Auto hide")).toBeInTheDocument();

    // Fast-forward time
    jest.advanceTimersByTime(1300); // duration + animation delay

    expect(handleClose).toHaveBeenCalled();
    jest.useRealTimers();
  });

  it("should use default duration of 3000ms", async () => {
    jest.useFakeTimers();
    const handleClose = jest.fn();

    render(<Toast message="Default duration" onClose={handleClose} />);

    jest.advanceTimersByTime(2000);
    expect(handleClose).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1300);
    expect(handleClose).toHaveBeenCalled();

    jest.useRealTimers();
  });

  it("should handle custom duration", async () => {
    jest.useFakeTimers();
    const handleClose = jest.fn();

    render(<Toast message="Custom" duration={5000} onClose={handleClose} />);

    jest.advanceTimersByTime(4000);
    expect(handleClose).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1300);
    expect(handleClose).toHaveBeenCalled();

    jest.useRealTimers();
  });
});
