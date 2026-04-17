import { test, expect } from "@playwright/test";
import { loginAs, uniqueTestEmail } from "./helpers/login";

test("non-admin visiting /admin/cases sees 'Admin access required'", async ({
  page,
}) => {
  const email = uniqueTestEmail("admin-guard");
  await loginAs(page, email, {
    role: "attending",
    ack_disclaimer: true,
    is_admin: false,
  });

  const res = await page.goto("/admin/cases");
  // Must not be a 500 — either 200 (message) or 401/403 are acceptable,
  // but the current layout returns a rendered page, so expect 200.
  expect(res?.status()).toBeLessThan(500);
  await expect(page.getByText(/Admin access required/i)).toBeVisible();
});
