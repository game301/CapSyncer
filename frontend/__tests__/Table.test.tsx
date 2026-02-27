import { render, screen } from "@testing-library/react";
import { Table } from "../components/Table";
import userEvent from "@testing-library/user-event";

describe("Table Component", () => {
  const mockData = [
    { id: 1, name: "John Doe", email: "john@test.com", role: "Developer" },
    { id: 2, name: "Jane Smith", email: "jane@test.com", role: "Designer" },
    { id: 3, name: "Bob Wilson", email: "bob@test.com", role: "Manager" },
  ];

  const mockColumns = [
    { header: "Name", accessor: "name" as const },
    { header: "Email", accessor: "email" as const },
    { header: "Role", accessor: "role" as const },
  ];

  it("renders table with data", () => {
    render(<Table data={mockData} columns={mockColumns} />);

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Role")).toBeInTheDocument();

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("jane@test.com")).toBeInTheDocument();
    expect(screen.getByText("Manager")).toBeInTheDocument();
  });

  it("renders empty table when no data provided", () => {
    render(<Table data={[]} columns={mockColumns} />);

    expect(screen.getByText("No data available")).toBeInTheDocument();
    expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
  });

  it("renders accessor functions correctly", () => {
    const columnsWithFunction = [
      { header: "Name", accessor: "name" as const },
      {
        header: "Full Info",
        accessor: (item: (typeof mockData)[0]) => `${item.name} - ${item.role}`,
      },
    ];

    render(<Table data={mockData} columns={columnsWithFunction} />);

    expect(screen.getByText("John Doe - Developer")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith - Designer")).toBeInTheDocument();
  });

  it("displays all rows", () => {
    render(<Table data={mockData} columns={mockColumns} />);

    const rows = screen.getAllByRole("row");
    // +1 for header row
    expect(rows).toHaveLength(mockData.length + 1);
  });
});
