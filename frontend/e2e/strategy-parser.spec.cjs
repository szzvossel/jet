const { test, expect } = require("./fixtures/test");

test.describe("Strategy Parser", () => {
  test.beforeEach(async ({ page }) => {
    // Strategy tab is default; just verify it's active
    await expect(
      page.locator("button", { hasText: "Option Strategy" })
    ).toHaveClass(/text-brand-400/);
  });

  test("text input and Parse button are visible", async ({ page }) => {
    await expect(
      page.locator('input[placeholder*="SPX apr26"]')
    ).toBeVisible();
    await expect(page.locator("button", { hasText: "Parse" })).toBeVisible();
  });

  test("example buttons auto-fill input and trigger parse", async ({
    page,
  }) => {
    const exampleBtn = page
      .locator("button", { hasText: "SPX apr26 110% Call A" })
      .first();
    await exampleBtn.click();

    // Strategy summary card should appear with parsed data
    await expect(page.getByText("Strategy").first()).toBeVisible();
    await expect(page.getByText("Legs").first()).toBeVisible();
    await expect(page.getByText("Underlying")).toBeVisible();
  });

  test("single-leg call strategy parses correctly", async ({ page }) => {
    const input = page.locator('input[placeholder*="SPX apr26"]');
    await input.fill("SPX apr26 110% Call A");
    await page.locator("button", { hasText: "Parse" }).click();

    // Should show strategy name
    await expect(page.getByText("Single Option")).toBeVisible();
    // Should show exactly 1 leg
    await expect(
      page.locator("div").filter({ hasText: /^1$/ }).first()
    ).toBeVisible();
  });

  test("multi-leg spread strategy parses correctly", async ({ page }) => {
    const exampleBtn = page.locator("button", {
      hasText: "SPX apr26 +1 110%C A / -1 100%P A",
    });
    await exampleBtn.click();

    // Should show 2 legs
    await expect(
      page.locator("div").filter({ hasText: /^2$/ }).first()
    ).toBeVisible();

    // Should show aggregate Greeks
    await expect(page.getByText("Net Premium")).toBeVisible();
    await expect(page.getByText("Net Delta")).toBeVisible();
  });

  test("invalid input shows error message", async ({ page }) => {
    const input = page.locator('input[placeholder*="SPX apr26"]');
    await input.fill("INVALID INPUT XYZ");
    await page.locator("button", { hasText: "Parse" }).click();

    // Error banner should appear
    await expect(page.locator('[class*="bg-red-900"]')).toBeVisible();
  });

  test("Parse button is disabled when input is empty", async ({ page }) => {
    const input = page.locator('input[placeholder*="SPX apr26"]');
    await input.fill("");
    const parseBtn = page.locator("button", { hasText: "Parse" });
    await expect(parseBtn).toBeDisabled();
  });
});
