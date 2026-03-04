import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input, Select, Textarea } from "../components/FormInputs";

describe("Form Input Components", () => {
  describe("Input", () => {
    it("should render with label", () => {
      render(<Input label="Name" />);
      expect(screen.getByText("Name")).toBeInTheDocument();
    });

    it("should handle onChange event", async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();

      render(<Input label="Name" onChange={handleChange} />);

      const input = screen.getByRole("textbox");
      await user.type(input, "John");

      expect(handleChange).toHaveBeenCalled();
    });

    it("should display required indicator when required", () => {
      render(<Input label="Email" required />);
      const input = screen.getByRole("textbox");
      expect(input).toBeRequired();
    });

    it("should be disabled when disabled prop is true", () => {
      render(<Input label="Name" disabled />);
      const input = screen.getByRole("textbox");
      expect(input).toBeDisabled();
    });

    it("should display error message", () => {
      render(<Input label="Email" error="Invalid email" />);
      expect(screen.getByText("Invalid email")).toBeInTheDocument();
    });

    it("should accept type prop", () => {
      render(<Input label="Age" type="number" />);
      const input = screen.getByRole("spinbutton");
      expect(input).toHaveAttribute("type", "number");
    });

    it("should accept placeholder", () => {
      render(<Input label="Name" placeholder="Enter your name" />);
      expect(
        screen.getByPlaceholderText("Enter your name"),
      ).toBeInTheDocument();
    });
  });

  describe("Select", () => {
    const options = [
      { value: "1", label: "Option 1" },
      { value: "2", label: "Option 2" },
      { value: "3", label: "Option 3" },
    ];

    it("should render with label and options", () => {
      render(<Select label="Choose" options={options} />);
      expect(screen.getByText("Choose")).toBeInTheDocument();
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("should render all options", () => {
      render(<Select label="Choose" options={options} />);
      expect(screen.getByText("Option 1")).toBeInTheDocument();
      expect(screen.getByText("Option 2")).toBeInTheDocument();
      expect(screen.getByText("Option 3")).toBeInTheDocument();
    });

    it("should handle onChange event", async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();

      render(
        <Select label="Choose" options={options} onChange={handleChange} />,
      );

      await user.selectOptions(screen.getByRole("combobox"), "2");
      expect(handleChange).toHaveBeenCalled();
    });

    it("should be disabled when disabled prop is true", () => {
      render(<Select label="Choose" options={options} disabled />);
      expect(screen.getByRole("combobox")).toBeDisabled();
    });

    it("should display error message", () => {
      render(
        <Select
          label="Choose"
          options={options}
          error="Please select an option"
        />,
      );
      expect(screen.getByText("Please select an option")).toBeInTheDocument();
    });

    it("should handle numeric values", () => {
      const numericOptions = [
        { value: 1, label: "One" },
        { value: 2, label: "Two" },
      ];
      render(<Select label="Number" options={numericOptions} />);
      expect(screen.getByText("One")).toBeInTheDocument();
    });
  });

  describe("Textarea", () => {
    it("should render with label", () => {
      render(<Textarea label="Description" />);
      expect(screen.getByText("Description")).toBeInTheDocument();
    });

    it("should handle onChange event", async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();

      render(<Textarea label="Description" onChange={handleChange} />);

      const textarea = screen.getByRole("textbox");
      await user.type(textarea, "Test description");

      expect(handleChange).toHaveBeenCalled();
    });

    it("should accept rows prop", () => {
      render(<Textarea label="Description" rows={5} />);
      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveAttribute("rows", "5");
    });

    it("should be disabled when disabled prop is true", () => {
      render(<Textarea label="Description" disabled />);
      expect(screen.getByRole("textbox")).toBeDisabled();
    });

    it("should display error message", () => {
      render(<Textarea label="Description" error="Required field" />);
      expect(screen.getByText("Required field")).toBeInTheDocument();
    });

    it("should accept placeholder", () => {
      render(<Textarea label="Notes" placeholder="Enter notes here" />);
      expect(
        screen.getByPlaceholderText("Enter notes here"),
      ).toBeInTheDocument();
    });
  });
});
