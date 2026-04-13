const { test, expect } = require("./fixtures/test");

test.describe("Derived Data Marking", () => {
  test.beforeEach(async ({ page }) => {
    await page.locator("button", { hasText: "Derived Data Marking" }).click();
  });

  test("sidebar shows 4 sub-sections", async ({ page }) => {
    await expect(
      page.locator("nav button", { hasText: "Volatility Surface" })
    ).toBeVisible();
    await expect(
      page.locator("nav button", { hasText: "Dividend" })
    ).toBeVisible();
    await expect(
      page.locator("nav button", { hasText: "Repo Curve" })
    ).toBeVisible();
    await expect(
      page.locator("nav button", { hasText: "Correlation" })
    ).toBeVisible();
  });

  test("Volatility Surface section loads with smile parameters table", async ({
    page,
  }) => {
    await expect(
      page.getByRole("heading", { name: "Volatility Surface" })
    ).toBeVisible();
    // Smile parameters table header should be present
    await expect(page.getByText("Smile Parameters")).toBeVisible();
    await expect(page.getByText("ATM Vol").first()).toBeVisible();
  });

  test("editable vol smile inputs update when changed", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Volatility Surface" })
    ).toBeVisible();

    // Find the first ATM Vol input (type number)
    const atmInputs = page.locator(
      'table input[type="number"]'
    );
    const firstInput = atmInputs.first();
    await expect(firstInput).toBeVisible();

    // Clear and type a new value
    await firstInput.fill("25.0");
    await firstInput.blur();

    // Input should reflect the new value
    await expect(firstInput).toHaveValue("25.0");
  });

  test("Dividend section shows yield cards and event table", async ({
    page,
  }) => {
    await page.locator("nav button", { hasText: "Dividend" }).click();

    await expect(page.getByText("Current Yield")).toBeVisible();
    await expect(page.getByText("Implied Yield")).toBeVisible();
    await expect(page.getByText("Next Ex-Date")).toBeVisible();

    // Event table should have columns
    await expect(page.getByText("Ex-Date").first()).toBeVisible();
    await expect(page.getByText("Amount").first()).toBeVisible();
  });

  test("Repo Curve section shows yield curve chart and rate table", async ({
    page,
  }) => {
    await page.locator("nav button", { hasText: "Repo Curve" }).click();

    await expect(
      page.getByRole("heading", { name: "Repo & Yield Curves" })
    ).toBeVisible();

    // Rate table should be present with Tenor column
    await expect(page.getByText("Tenor").first()).toBeVisible();
  });

  test("Correlation section shows heatmap and pairwise table", async ({
    page,
  }) => {
    await page.locator("nav button", { hasText: "Correlation" }).click();

    await expect(
      page.getByRole("heading", { name: "Correlation Matrix" })
    ).toBeVisible();
    await expect(page.getByText("Heatmap")).toBeVisible();
    await expect(page.getByText("Pairwise Correlations")).toBeVisible();
  });
});
