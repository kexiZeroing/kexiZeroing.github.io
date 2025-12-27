import { expect, test } from "@playwright/test";

// VSCode Testing -> Record new
test.describe("My Blog", () => {
  test("should load page", async ({ page }) => {
    // by default, `page.goto()` waits for the load event.
    // https://www.checklyhq.com/blog/why-page-goto-is-slowing-down-your-playwright-test
    await page.goto("https://kexizeroing.github.io/", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("link", { name: "Home" })).toHaveClass(/active/);
  });

  test("has blog title", async ({ page }) => {
    await page.goto("https://kexizeroing.github.io/");
    await page.getByRole("link", { name: "Posts" }).click();
    await page.getByRole("link", { name: "TIL" }).click();

    await expect(page).toHaveTitle(/Blog - TIL/);
  });

  test("should toggle theme", async ({ page }) => {
    await page.goto("https://kexizeroing.github.io/");
    await page.getByLabel("switch theme").click();

    await expect(page.locator("html")).toHaveClass(/theme-dark/);
  });
});
