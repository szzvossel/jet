const { test: base, expect } = require("@playwright/test");

/**
 * Shared test fixture that:
 * 1. Injects localStorage to force "remote" backend mode before React renders
 * 2. Navigates to /
 * 3. Waits for the splash screen (2.8s) to auto-dismiss by polling for <header>
 */
const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      localStorage.setItem("jet-backend-mode", "remote");
      localStorage.setItem("jet-remote-url", "http://localhost:3000");
    });

    await page.goto("/");

    // Splash screen takes 2800ms to auto-dismiss; wait for the main header to appear
    await page.locator("header").waitFor({ state: "visible", timeout: 15_000 });

    await use(page);
  },
});

module.exports = { test, expect };
