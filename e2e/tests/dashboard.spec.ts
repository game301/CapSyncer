import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
  });

  test("should display dashboard title", async ({ page }) => {
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible({
      timeout: 10000,
    });
  });

  test("should display coworker capacity bars", async ({ page }) => {
    // Wait for data to load
    await page.waitForLoadState("networkidle");

    // Should show progress bars for each coworker
    const progressBars = page.locator('[role="progressbar"]');
    await expect(progressBars.first()).toBeVisible({ timeout: 10000 });
  });

  test("should show utilization percentages", async ({ page }) => {
    // Wait for data to load
    await page.waitForLoadState("networkidle");

    // Should display percentage values (e.g., "50%", "75%")
    const percentageText = page.locator("text=/%/").first();
    await expect(percentageText).toBeVisible({ timeout: 10000 });
  });

  test("should toggle between team and personal view", async ({ page }) => {
    // Wait for view to load
    await expect(page.locator("text=Team View")).toBeVisible({
      timeout: 10000,
    });

    // Click personal view tab/button
    const personalButton = page.locator('button:has-text("Personal")');
    await personalButton.click();

    // View should change
    await expect(page.locator("text=Personal View")).toBeVisible({
      timeout: 5000,
    });

    // Switch back
    const teamButton = page.locator('button:has-text("Team")');
    await teamButton.click();
    await expect(page.locator("text=Team View")).toBeVisible({ timeout: 5000 });
  });

  test("should load data from API", async ({ page }) => {
    // Wait for data to load
    await page.waitForLoadState("networkidle");
    await page.waitForSelector("table tbody tr", { timeout: 10000 });

    // Should have at least one row
    const rows = await page.locator("table tbody tr").count();
    expect(rows).toBeGreaterThan(0);
  });

  test("should be responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Dashboard should still be visible
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible({
      timeout: 10000,
    });
  });
});
