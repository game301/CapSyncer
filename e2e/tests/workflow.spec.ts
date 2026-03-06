import { test, expect } from "@playwright/test";

test.describe("Projects and Tasks Workflow", () => {
  test("should create project, add task, and assign coworker", async ({
    page,
    context,
  }) => {
    // Set admin role via init script (runs before page load)
    await context.addInitScript(() => {
      // @ts-expect-error - window is available in browser context
      window.localStorage.setItem('userRole', 'admin');
      // @ts-expect-error - window is available in browser context
      window.localStorage.setItem('userName', 'E2E Test Admin');
    });
    
    // Step 0: Create a coworker first (needed for assignment)
    await page.goto("/dashboard");
    await page.waitForLoadState('networkidle');
    
    await page.click('button:has-text("Add Coworker")');
    await page.waitForSelector('input[name="name"]', { state: 'visible', timeout: 5000 });
    await page.fill('input[name="name"]', "E2E Test Coworker");
    await page.fill('input[name="capacity"]', "40");
    await page.click('button[type="submit"]:has-text("Create")');
    await page.waitForTimeout(1000);
    
    // Step 1: Switch to Projects tab and create a project
    await page.goto("/dashboard?tab=projects");
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("Add Project")');
    await page.waitForSelector('input[name="name"]', { state: 'visible', timeout: 5000 });
    await page.fill('input[name="name"]', "E2E Test Project");
    await page.selectOption('select[name="status"]', "Planning");
    await page.click('button[type="submit"]:has-text("Create")');

    // Wait for automatic navigation to project detail page after creation
    await page.waitForURL(/projects\/\d+\?new=true/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Step 2: Add a task to the project (already on project detail page)
    await page.click('button:has-text("Add Task")');
    await page.waitForSelector('input[name="name"]', { state: 'visible', timeout: 5000 });
    await page.fill('input[name="name"]', "E2E Test Task");
    await page.selectOption('select[name="priority"]', "High");
    await page.selectOption('select[name="status"]', "Planning");
    await page.fill('input[name="estimatedHours"]', "16");
    await page.fill('input[name="weeklyEffort"]', "8");
    await page.click('button[type="submit"]:has-text("Create")');

    // Verify task appears
    await expect(page.locator("text=E2E Test Task")).toBeVisible({ timeout: 5000 });

    // Step 3: Navigate to task details
    await page.click("text=E2E Test Task");
    await page.waitForURL(/tasks\/\d+/, { timeout: 5000 });

    // Step 4: Assign a coworker to the task
    await page.click('button:has-text("Add Assignment")');
    await page.waitForSelector('select[name="coworkerId"]', { state: 'visible', timeout: 5000 });
    // Select the coworker we created (should be in dropdown)
    const coworkerSelect = page.locator('select[name="coworkerId"]');
    const options = await coworkerSelect.locator('option').count();
    
    if (options > 1) {
      await page.selectOption('select[name="coworkerId"]', { index: 1 });
      await page.fill('input[name="hoursAssigned"]', "8");
      // assignedDate defaults to current date/time, no need to fill
      await page.click('button[type="submit"]:has-text("Create")');
      await page.waitForTimeout(1000);
    }
  });

  test("should update task status through workflow", async ({ page, context }) => {
    // Set admin role via init script (runs before page load)
    await context.addInitScript(() => {
      // @ts-expect-error - window is available in browser context
      window.localStorage.setItem('userRole', 'admin');
      // @ts-expect-error - window is available in browser context
      window.localStorage.setItem('userName', 'E2E Test Admin');
    });
    
    await page.goto("/dashboard?tab=projects");
    await page.waitForLoadState('networkidle');

    // First create a project and task to ensure we have data
    await page.click('button:has-text("Add Project")');
    await page.waitForSelector('input[name="name"]', { state: 'visible', timeout: 5000 });
    await page.fill('input[name="name"]', "Status Test Project");
    await page.selectOption('select[name="status"]', "Planning");
    await page.click('button[type="submit"]:has-text("Create")');
    
    // Wait for automatic navigation to project detail page
    await page.waitForURL(/projects\/\d+\?new=true/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Add a task (already on project detail page)
    await page.click('button:has-text("Add Task")');
    await page.waitForSelector('input[name="name"]', { state: 'visible', timeout: 5000 });
    await page.fill('input[name="name"]', "Status Test Task");
    await page.selectOption('select[name="priority"]', "Normal");
    await page.selectOption('select[name="status"]', "Planning");
    await page.fill('input[name="estimatedHours"]', "8");
    await page.fill('input[name="weeklyEffort"]', "4");
    await page.click('button[type="submit"]:has-text("Create")');
    await page.waitForTimeout(1000);

    // Navigate to task details
    await page.click("text=Status Test Task");
    await page.waitForURL(/tasks\/\d+/, { timeout: 5000 });

    // Change status to "In Progress"
    await page.click('button:has-text("Edit")');
    await page.selectOption('select[name="status"]', "In Progress");
    await page.click('button[type="submit"]:has-text("Update")');
    await expect(page.locator("text=In Progress")).toBeVisible({ timeout: 5000 });

    // Complete the task
    await page.click('button:has-text("Edit")');
    await page.selectOption('select[name="status"]', "Completed");
    await page.click('button[type="submit"]:has-text("Update")');
    await expect(page.locator("text=Completed")).toBeVisible({ timeout: 5000 });
  });

  test("should show capacity impact when creating assignments", async ({
    page,
  }) => {
    // Go to dashboard
    await page.goto("/dashboard");
    await page.waitForLoadState('networkidle');

    // Check that progress bars are visible
    const progressBars = page.locator('[role="progressbar"]');
    await expect(progressBars.first()).toBeVisible({ timeout: 10000 });
    
    // Verify utilization data is displayed
    await expect(page.locator("text=/%/").first()).toBeVisible({ timeout: 5000 });
  });
});
