import { test, expect } from "@playwright/test";

test.describe("Coworkers Management", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should load homepage", async ({ page }) => {
    await expect(page).toHaveTitle(/CapSyncer/);
  });

  test("should navigate to coworkers page", async ({ page }) => {
    await page.click('a[href*="coworkers"]');
    await expect(page).toHaveURL(/coworkers/);
  });

  test("should create a new coworker", async ({ page }) => {
    // Navigate to coworkers
    await page.goto("/coworkers");

    // Click "Add Coworker" button
    await page.click('button:has-text("Add")');

    // Fill in form
    await page.fill('input[name="name"]', "E2E Test User");
    await page.fill('input[name="email"]', "e2e@test.com");
    await page.fill('input[name="role"]', "QA Engineer");
    await page.fill('input[name="capacity"]', "40");

    // Submit form
    await page.click('button[type="submit"]');

    // Verify coworker appears in list
    await expect(page.locator("text=E2E Test User")).toBeVisible();
    await expect(page.locator("text=e2e@test.com")).toBeVisible();
  });

  test("should edit an existing coworker", async ({ page }) => {
    await page.goto("/coworkers");

    // Click edit button on first coworker
    await page.click('button[aria-label="Edit"]:first-of-type');

    // Update name
    await page.fill('input[name="name"]', "Updated Name");

    // Submit
    await page.click('button[type="submit"]');

    // Verify update
    await expect(page.locator("text=Updated Name")).toBeVisible();
  });

  test("should delete a coworker", async ({ page }) => {
    await page.goto("/coworkers");

    // Get initial row count
    const initialRows = await page.locator("table tbody tr").count();

    // Click delete on first coworker
    await page.click('button[aria-label="Delete"]:first-of-type');

    // Confirm deletion
    await page.click('button:has-text("Confirm")');

    // Verify row removed
    const finalRows = await page.locator("table tbody tr").count();
    expect(finalRows).toBe(initialRows - 1);
  });

  test("should search/filter coworkers", async ({ page }) => {
    await page.goto("/coworkers");

    // Type in search box
    await page.fill('input[placeholder*="Search"]', "John");

    // Only matching results should be visible
    await expect(page.locator("table tbody tr")).toHaveCount(1);
  });

  test("should view coworker details", async ({ page }) => {
    await page.goto("/coworkers");

    // Click on first coworker row
    await page.click("table tbody tr:first-child");

    // Should navigate to detail page
    await expect(page).toHaveURL(/coworkers\/\d+/);

    // Should show detailed information
    await expect(page.locator("h1")).toBeVisible();
  });
});
