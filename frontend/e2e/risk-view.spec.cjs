const { test, expect } = require("./fixtures/test");

test.describe("Risk View", () => {
  test.beforeEach(async ({ page }) => {
    await page.locator("button", { hasText: "Risk View" }).click();
  });

  test("summary cards auto-load with 6 Greek totals", async ({ page }) => {
    await expect(page.getByText("Total Delta")).toBeVisible();
    await expect(page.getByText("Total Gamma")).toBeVisible();
    await expect(page.getByText("Total Vega")).toBeVisible();
    await expect(page.getByText("Total Theta")).toBeVisible();
    await expect(page.getByText("Total Epsilon")).toBeVisible();
    await expect(page.getByText("Total Rho")).toBeVisible();
  });

  test("Position Greeks grid renders with data", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Position Greeks" })
    ).toBeVisible();

    // Table should contain at least one row of data
    const table = page.locator("table").first();
    const rows = table.locator("tbody tr");
    await expect(rows.first()).toBeVisible();
  });

  test("Delta Exposure section renders with canvas chart", async ({
    page,
  }) => {
    await expect(
      page.getByRole("heading", { name: "Delta Exposure" })
    ).toBeVisible();

    // Canvas element for the chart should be present
    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible();
  });
});
