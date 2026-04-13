const { test, expect } = require("./fixtures/test");

test.describe("P&L Explanation", () => {
  test.beforeEach(async ({ page }) => {
    await page.locator("button", { hasText: "P&L Explanation" }).click();
  });

  test("summary cards render with 4 P&L breakdowns", async ({ page }) => {
    await expect(page.getByText("Total P&L").first()).toBeVisible();
    await expect(page.getByText("Delta P&L").first()).toBeVisible();
    await expect(page.getByText("Gamma+Vega P&L")).toBeVisible();
    await expect(page.getByText("Theta+Residual")).toBeVisible();
  });

  test("P&L Attribution table renders with data rows", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "P&L Attribution" })
    ).toBeVisible();

    // Table should contain data rows
    const table = page.locator("table").first();
    const rows = table.locator("tbody tr");
    await expect(rows.first()).toBeVisible();
  });

  test("P&L Decomposition waterfall chart renders on canvas", async ({
    page,
  }) => {
    await expect(
      page.getByRole("heading", { name: "P&L Decomposition" })
    ).toBeVisible();

    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible();
  });
});
