const { test, expect } = require("./fixtures/test");

test.describe("Backend toggle", () => {
  test("Local and Remote buttons are visible in header", async ({ page }) => {
    const header = page.locator("header");
    await expect(header.getByRole("button", { name: "Local" })).toBeVisible();
    await expect(header.getByRole("button", { name: "Remote" })).toBeVisible();
  });

  test("Remote button is active (injected via localStorage)", async ({
    page,
  }) => {
    const remoteBtn = page.locator("header").getByRole("button", {
      name: "Remote",
    });
    await expect(remoteBtn).toHaveClass(/bg-indigo-600/);
  });

  test("URL input is visible when Remote is active", async ({ page }) => {
    const urlInput = page.locator(
      'header input[placeholder="http://localhost:3000"]'
    );
    await expect(urlInput).toBeVisible();
    await expect(urlInput).toHaveValue("http://localhost:3000");
  });

  test("clicking Local hides URL input and activates Local", async ({
    page,
  }) => {
    await page.locator("header").getByRole("button", { name: "Local" }).click();

    const localBtn = page.locator("header").getByRole("button", {
      name: "Local",
    });
    await expect(localBtn).toHaveClass(/bg-indigo-600/);

    // URL input should be hidden in Local mode
    const urlInput = page.locator(
      'header input[placeholder="http://localhost:3000"]'
    );
    await expect(urlInput).not.toBeVisible();

    // Verify localStorage was updated
    const mode = await page.evaluate(() =>
      localStorage.getItem("jet-backend-mode")
    );
    expect(mode).toBe("local");
  });
});
