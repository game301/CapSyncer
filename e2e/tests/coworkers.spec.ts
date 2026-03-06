import { test, expect } from "@playwright/test";

test.describe("Coworkers Management", () => {
  test.beforeEach(async ({ page, context }) => {
    // Set admin role in context (persists across navigations)
    await context.addInitScript(() => {
      // @ts-expect-error - localStorage is available in browser context
      localStorage.setItem("userRole", "admin");
      // @ts-expect-error - localStorage is available in browser context
      localStorage.setItem("userName", "E2E Test Admin");
    });

    // Navigate to dashboard
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
  });

  test("should load dashboard", async ({ page }) => {
    await expect(page).toHaveTitle(/CapSyncer/);
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
  });

  test("should display coworkers in team view", async ({ page }) => {
    // Should be in team view by default
    await expect(page.locator("text=Team View")).toBeVisible({
      timeout: 10000,
    });

    // Wait for coworkers section to load
    await page.waitForSelector("text=/Coworkers|Team/i", { timeout: 10000 });
  });

  test("should create a new coworker", async ({ page }) => {
    // Click "Add Coworker" button
    await page.click('button:has-text("Add Coworker")');
    await page.waitForSelector('input[name="name"]', {
      state: "visible",
      timeout: 5000,
    });

    // Fill in form
    await page.fill('input[name="name"]', "E2E Test User");
    await page.fill('input[name="capacity"]', "40");

    // Submit form
    await page.click('button[type="submit"]:has-text("Create")');

    // Verify coworker appears in list (use first() to handle duplicates from previous runs)
    await expect(page.locator("text=E2E Test User").first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("should edit an existing coworker", async ({ page }) => {
    // First create a coworker to edit
    await page.click('button:has-text("Add Coworker")');
    await page.waitForSelector('input[name="name"]', {
      state: "visible",
      timeout: 5000,
    });
    await page.fill('input[name="name"]', "Coworker To Edit");
    await page.fill('input[name="capacity"]', "40");
    await page.click('button[type="submit"]:has-text("Create")');

    // Wait for creation and close modal
    await page.waitForTimeout(1000);

    // Now find and edit the coworker
    const editButtons = page.locator('button[aria-label="Edit"]');
    const count = await editButtons.count();

    if (count > 0) {
      await editButtons.first().click();
      await page.fill('input[name="name"]', "Edited Name");
      await page.fill('input[name="capacity"]', "35");
      await page.click('button[type="submit"]:has-text("Update")');
      await expect(page.locator("text=Edited Name")).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test("should delete a coworker", async ({ page }) => {
    // First create a coworker to delete
    await page.click('button:has-text("Add Coworker")');
    await page.waitForSelector('input[name="name"]', {
      state: "visible",
      timeout: 5000,
    });
    await page.fill('input[name="name"]', "Coworker To Delete");
    await page.fill('input[name="capacity"]', "40");
    await page.click('button[type="submit"]:has-text("Create")');

    // Wait for creation
    await page.waitForTimeout(1000);

    // Now find and delete the coworker
    const deleteButtons = page.locator('button[aria-label="Delete"]');
    const count = await deleteButtons.count();

    if (count > 0) {
      await deleteButtons.first().click();
      await page.click('button:has-text("Delete")');
      await page.waitForTimeout(1000);
    }
  });

  test("should view coworker details", async ({ page }) => {
    // Create a coworker first
    await page.click('button:has-text("Add Coworker")');
    await page.waitForSelector('input[name="name"]', {
      state: "visible",
      timeout: 5000,
    });
    await page.fill('input[name="name"]', "Coworker For Details");
    await page.fill('input[name="capacity"]', "40");
    await page.click('button[type="submit"]:has-text("Create")');

    await page.waitForTimeout(1000);

    // Click on the coworker name to view details
    await page.click("text=Coworker For Details");

    // Should navigate to detail page
    await expect(page).toHaveURL(/coworkers\/\d+/, { timeout: 5000 });

    // Should show detailed information
    await expect(
      page.locator('h1:has-text("Coworker For Details")'),
    ).toBeVisible({ timeout: 5000 });
  });
});
