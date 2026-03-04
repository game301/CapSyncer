import { test, expect } from "@playwright/test";

test.describe("Projects and Tasks Workflow", () => {
  test("should create project, add task, and assign coworker", async ({
    page,
  }) => {
    // Step 1: Create a project
    await page.goto("/projects");
    await page.click('button:has-text("Add Project")');

    await page.fill('input[name="name"]', "E2E Test Project");
    await page.fill('textarea[name="description"]', "Project for E2E testing");
    await page.click('button[type="submit"]');

    await expect(page.locator("text=E2E Test Project")).toBeVisible();

    // Step 2: Navigate to project details
    await page.click("text=E2E Test Project");
    await expect(page).toHaveURL(/projects\/\d+/);

    // Step 3: Add a task to the project
    await page.click('button:has-text("Add Task")');

    await page.fill('input[name="title"]', "E2E Test Task");
    await page.selectOption('select[name="priority"]', "High");
    await page.selectOption('select[name="status"]', "To Do");
    await page.fill('input[name="estimatedHours"]', "16");
    await page.click('button[type="submit"]');

    await expect(page.locator("text=E2E Test Task")).toBeVisible();

    // Step 4: Navigate to task details
    await page.click("text=E2E Test Task");
    await expect(page).toHaveURL(/tasks\/\d+/);

    // Step 5: Assign a coworker to the task
    await page.click('button:has-text("Add Assignment")');

    // Select first available coworker
    await page.selectOption('select[name="coworkerId"]', { index: 1 });
    await page.fill('input[name="allocatedHours"]', "8");
    await page.fill('input[name="assignedBy"]', "E2E Test Manager");
    await page.click('button[type="submit"]');

    // Verify assignment appears
    await expect(
      page.locator("table").locator("text=/\\d+ hours/"),
    ).toBeVisible();
  });

  test("should update task status through workflow", async ({ page }) => {
    await page.goto("/tasks");

    // Find a "To Do" task
    await page.click('table tbody tr:has-text("To Do"):first-of-type');

    // Change status to "In Progress"
    await page.click('button:has-text("Edit")');
    await page.selectOption('select[name="status"]', "In Progress");
    await page.click('button[type="submit"]');

    await expect(page.locator("text=In Progress")).toBeVisible();

    // Complete the task
    await page.click('button:has-text("Edit")');
    await page.selectOption('select[name="status"]', "Completed");
    await page.click('button[type="submit"]');

    await expect(page.locator("text=Completed")).toBeVisible();
  });

  test("should show capacity impact when creating assignments", async ({
    page,
  }) => {
    // Go to dashboard
    await page.goto("/dashboard");

    // Note current utilization
    const initialUtilization = await page
      .locator(".progress-bar")
      .first()
      .getAttribute("aria-valuenow");

    // Create a new assignment
    await page.goto("/assignments");
    await page.click('button:has-text("Add")');

    // Fill assignment form
    await page.selectOption('select[name="taskId"]', { index: 1 });
    await page.selectOption('select[name="coworkerId"]', { index: 1 });
    await page.fill('input[name="allocatedHours"]', "20");
    await page.click('button[type="submit"]');

    // Go back to dashboard
    await page.goto("/dashboard");

    // Utilization should have increased
    const newUtilization = await page
      .locator(".progress-bar")
      .first()
      .getAttribute("aria-valuenow");

    expect(Number(newUtilization)).toBeGreaterThan(Number(initialUtilization));
  });
});
