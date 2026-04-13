const { test, expect } = require("./fixtures/test");

const TABS = [
  { id: "strategy", label: "Option Strategy" },
  { id: "pricing", label: "Option Pricing" },
  { id: "derived", label: "Derived Data Marking" },
  { id: "risk", label: "Risk View" },
  { id: "pnl", label: "P&L Explanation" },
  { id: "tracer", label: "Tracer" },
];

test.describe("App navigation", () => {
  test("all 6 tabs are visible in the tab bar", async ({ page }) => {
    for (const tab of TABS) {
      await expect(
        page.locator("button", { hasText: tab.label })
      ).toBeVisible();
    }
  });

  test("default active tab is Option Strategy", async ({ page }) => {
    const activeTab = page.locator("button.text-brand-400");
    await expect(activeTab).toHaveText("Option Strategy");
  });

  test("clicking Option Pricing tab switches content", async ({ page }) => {
    await page.locator("button", { hasText: "Option Pricing" }).click();
    await expect(
      page.getByRole("heading", { name: "Option Parameters" })
    ).toBeVisible();
  });

  test("clicking Option Strategy tab switches content", async ({ page }) => {
    // Navigate away first
    await page.locator("button", { hasText: "Option Pricing" }).click();
    await expect(
      page.getByRole("heading", { name: "Option Parameters" })
    ).toBeVisible();

    // Go back to Strategy
    await page.locator("button", { hasText: "Option Strategy" }).click();
    await expect(
      page.getByText("Option Strategy Input")
    ).toBeVisible();
  });

  test("clicking Derived Data Marking tab shows sidebar", async ({ page }) => {
    await page.locator("button", { hasText: "Derived Data Marking" }).click();
    await expect(
      page.getByRole("heading", { name: "Volatility Surface" })
    ).toBeVisible();
  });

  test("clicking Risk View tab loads risk summary", async ({ page }) => {
    await page.locator("button", { hasText: "Risk View" }).click();
    await expect(
      page.getByText("Total Delta")
    ).toBeVisible();
  });

  test("clicking P&L Explanation tab loads P&L data", async ({ page }) => {
    await page.locator("button", { hasText: "P&L Explanation" }).click();
    await expect(
      page.getByText("Total P&L").first()
    ).toBeVisible();
  });

  test("clicking Tracer tab shows tracer content", async ({ page }) => {
    await page.locator("button", { hasText: "Tracer" }).click();
    // Tracer tab should render something in the main content area
    const main = page.locator("main");
    await expect(main).not.toBeEmpty();
  });
});
