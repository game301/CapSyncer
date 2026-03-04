import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
  });

  test("should display dashboard title", async ({ page }) => {
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
  });

  test("should show weekly capacity view", async ({ page }) => {
    await expect(page.locator("text=/Week \\d+/")).toBeVisible();
  });

  test("should allow switching between weeks", async ({ page }) => {
    // Get current week number
    const currentWeek = await page.locator("text=/Week \\d+/").textContent();

    // Click next week
    await page.click('button[aria-label="Next week"]');

    // Week number should change
    const newWeek = await page.locator("text=/Week \\d+/").textContent();
    expect(newWeek).not.toBe(currentWeek);
  });

  test("should display coworker capacity bars", async ({ page }) => {
    // Should show progress bars for each coworker
    const progressBars = page.locator('[role="progressbar"]');
    await expect(progressBars.first()).toBeVisible();
  });

  test("should show utilization percentages", async ({ page }) => {
    // Should display percentage values (e.g., "50%", "75%")
    const percentageText = page.locator("text=/%/").first();
    await expect(percentageText).toBeVisible();
  });

  test("should toggle between team and personal view", async ({ page }) => {
    // Click view toggle
    await page.click('button:has-text("Personal")');

    // View should change
    await expect(page.locator("text=Personal View")).toBeVisible();

    // Switch back
    await page.click('button:has-text("Team")');
    await expect(page.locator("text=Team View")).toBeVisible();
  });

  test("should load data from API", async ({ page }) => {
    // Wait for data to load
    await page.waitForSelector("table tbody tr", { timeout: 5000 });

    // Should have at least one row
    const rows = await page.locator("table tbody tr").count();
    expect(rows).toBeGreaterThan(0);
  });

  test("should be responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Dashboard should still be visible
    await expect(page.locator("h1")).toBeVisible();

    // Navigation should collapse to hamburger menu
    await expect(page.locator('button[aria-label="Menu"]')).toBeVisible();
  });
});
