import { test, expect } from "@playwright/test";

test.describe("Cleanup Test Data (runs last)", () => {
  test("should delete all test data created during e2e tests", async ({
    page,
    context,
    request,
  }) => {
    // Set admin role via init script (runs before page load)
    await context.addInitScript(() => {
      // @ts-expect-error - localStorage is available in browser context
      localStorage.setItem("userRole", "admin");
      // @ts-expect-error - localStorage is available in browser context
      localStorage.setItem("userName", "E2E Test Admin");
    });

    const apiBaseUrl = "https://localhost:7060/api";

    // Helper to get all items of a type
    const getAllItems = async (endpoint: string) => {
      const response = await request.get(`${apiBaseUrl}/${endpoint}`);
      return response.ok() ? await response.json() : [];
    };

    // Helper to delete an item (handles soft delete for coworkers)
    const deleteItem = async (
      endpoint: string,
      id: number,
      isCoworker: boolean = false,
    ) => {
      console.log(`Deleting ${endpoint}/${id}...`);
      const response = await request.delete(`${apiBaseUrl}/${endpoint}/${id}`);
      console.log(`  → First delete status: ${response.status()}`);

      // For coworkers, first delete is soft delete (marks inactive)
      // Need to delete again for hard delete (permanent removal)
      if (isCoworker && response.ok()) {
        console.log(`  → Performing hard delete for coworker ${id}...`);
        const secondResponse = await request.delete(
          `${apiBaseUrl}/${endpoint}/${id}`,
        );
        console.log(`  → Second delete status: ${secondResponse.status()}`);
        return secondResponse.ok();
      }

      return response.ok();
    };

    console.log("=== Starting cleanup ===");

    // Step 1: Delete test coworkers (must be first due to FK constraints)
    // Note: Coworkers use soft delete, so we delete twice
    console.log("\n=== Cleaning coworkers (soft + hard delete) ===");
    const coworkers = await getAllItems("coworkers");
    console.log(`Found ${coworkers.length} total coworkers`);
    const testCoworkerNames = [
      "E2E Test Coworker",
      "E2E Test User",
      "Coworker To Delete",
      "Coworker To Edit",
      "Edited Name",
      "Coworker For Details",
    ];

    let deletedCount = 0;
    for (const coworker of coworkers) {
      if (testCoworkerNames.includes(coworker.name)) {
        console.log(
          `  Found test coworker: ${coworker.name} (id: ${coworker.id})`,
        );
        const success = await deleteItem("coworkers", coworker.id, true);
        if (success) {
          deletedCount++;
        }
      }
    }
    console.log(`Deleted ${deletedCount} test coworkers`);

    // Step 2: Delete test tasks
    console.log("\n=== Cleaning tasks ===");
    const tasks = await getAllItems("tasks");
    console.log(`Found ${tasks.length} total tasks`);
    const testTaskNames = ["E2E Test Task", "Status Test Task"];

    deletedCount = 0;
    for (const task of tasks) {
      if (testTaskNames.includes(task.name)) {
        console.log(`  Found test task: ${task.name} (id: ${task.id})`);
        const success = await deleteItem("tasks", task.id);
        if (success) {
          deletedCount++;
        }
      }
    }
    console.log(`Deleted ${deletedCount} test tasks`);

    // Step 3: Delete test projects
    console.log("\n=== Cleaning projects ===");
    const projects = await getAllItems("projects");
    console.log(`Found ${projects.length} total projects`);
    const testProjectNames = ["E2E Test Project", "Status Test Project"];

    deletedCount = 0;
    for (const project of projects) {
      if (testProjectNames.includes(project.name)) {
        console.log(
          `  Found test project: ${project.name} (id: ${project.id})`,
        );
        const success = await deleteItem("projects", project.id);
        if (success) {
          deletedCount++;
        }
      }
    }
    console.log(`Deleted ${deletedCount} test projects`);

    // Step 4: Verify cleanup on UI
    console.log("\n=== Verifying cleanup through UI ===");
    await page.goto("/dashboard?tab=coworkers");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);

    for (const name of testCoworkerNames) {
      const count = await page.locator(`tr:has-text("${name}")`).count();
      if (count > 0) {
        console.log(`⚠ ${name}: still visible (${count} found)`);
      } else {
        console.log(`✓ ${name}: removed from UI`);
      }
      expect(count).toBe(0);
    }

    await page.goto("/dashboard?tab=tasks");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);

    for (const name of testTaskNames) {
      const count = await page.locator(`tr:has-text("${name}")`).count();
      if (count > 0) {
        console.log(`⚠ ${name}: still visible (${count} found)`);
      } else {
        console.log(`✓ ${name}: removed from UI`);
      }
      expect(count).toBe(0);
    }

    await page.goto("/dashboard?tab=projects");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);

    for (const name of testProjectNames) {
      const count = await page.locator(`tr:has-text("${name}")`).count();
      if (count > 0) {
        console.log(`⚠ ${name}: still visible (${count} found)`);
      } else {
        console.log(`✓ ${name}: removed from UI`);
      }
      expect(count).toBe(0);
    }

    console.log("\n=== Cleanup complete ===");
  });
});
