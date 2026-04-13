const { test, expect } = require("./fixtures/test");

test.describe("Option Pricing", () => {
  test.beforeEach(async ({ page }) => {
    await page.locator("button", { hasText: "Option Pricing" }).click();
    await expect(
      page.getByRole("heading", { name: "Option Parameters" })
    ).toBeVisible();
  });

  test("Call/Put toggle switches option type", async ({ page }) => {
    const callBtn = page.locator("button", { hasText: /^Call$/ });
    const putBtn = page.locator("button", { hasText: /^Put$/ });

    // Call is selected by default
    await expect(callBtn).toHaveClass(/bg-brand-600/);

    // Click Put
    await putBtn.click();
    await expect(putBtn).toHaveClass(/bg-brand-600/);
    await expect(callBtn).not.toHaveClass(/bg-brand-600/);
  });

  test("Calculate Price button triggers pricing and shows result panel", async ({
    page,
  }) => {
    await page.locator("button", { hasText: "Calculate Price" }).click();

    // Result panel should show pricing data
    await expect(page.getByText("Pricing Result")).toBeVisible();
    await expect(page.getByText("Price").first()).toBeVisible();
    await expect(page.getByText("Delta").first()).toBeVisible();
  });

  test("result panel shows Price and all 5 Greeks", async ({ page }) => {
    await page.locator("button", { hasText: "Calculate Price" }).click();

    // Wait for result to load
    await expect(page.getByText("Call | Black-Scholes")).toBeVisible();

    // Verify all Greek labels appear
    for (const label of ["Price", "Delta", "Gamma", "Vega", "Theta", "Rho"]) {
      const greekLabel = page
        .locator("span.uppercase.tracking-wide")
        .filter({ hasText: label });
      await expect(greekLabel).toBeVisible();
    }
  });

  test("strike slider updates the displayed value", async ({ page }) => {
    const slider = page.locator('input[type="range"]').first();
    await slider.fill("120");

    // The label should reflect the new strike value
    const strikeLabel = page.getByText(/Strike Price \(K\):/);
    await expect(strikeLabel).toContainText("120");
  });

  test("changing to Put and pricing shows Put result", async ({ page }) => {
    await page.locator("button", { hasText: /^Put$/ }).click();
    await page.locator("button", { hasText: "Calculate Price" }).click();

    await expect(page.getByText("Put | Black-Scholes")).toBeVisible();
  });
});
