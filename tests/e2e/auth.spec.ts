import { test, expect } from "@playwright/test";
import { loginWithoutProfile, uniqueTestEmail } from "./helpers/login";

test.describe("auth redirects", () => {
  test("unauthed /feed redirects to /login?next=/feed", async ({ page }) => {
    await page.goto("/feed");
    await page.waitForURL(/\/login(\?.*)?$/);
    expect(page.url()).toContain("/login");
    expect(page.url()).toContain("next=%2Ffeed");
  });

  test("authed but no profile role redirects to /profile/setup", async ({ page }) => {
    const email = uniqueTestEmail("no-profile");
    await loginWithoutProfile(page, email);
    await page.goto("/feed");
    await page.waitForURL(/\/profile\/setup/);
    expect(page.url()).toContain("/profile/setup");
  });
});
