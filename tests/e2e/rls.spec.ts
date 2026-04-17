import { test, expect } from "@playwright/test";
import { loginAs, uniqueTestEmail } from "./helpers/login";

// A random UUID that will never match the logged-in user's id. If RLS is
// correct, an UPDATE against this row must affect zero rows (or be rejected).
const SOMEONE_ELSE = "00000000-0000-4000-a000-000000000001";

test("RLS blocks updating another user's profile from the browser", async ({
  page,
}) => {
  const email = uniqueTestEmail("rls");
  await loginAs(page, email, { role: "attending", ack_disclaimer: true });

  // Go to any authed page so the browser has the Supabase session cookies.
  await page.goto("/feed");

  const result = await page.evaluate(
    async ({ victimId, supabaseUrl, anonKey }) => {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/profiles?id=eq.${victimId}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "content-type": "application/json",
            apikey: anonKey,
            prefer: "return=representation",
          },
          body: JSON.stringify({ display_name: "hacked" }),
        },
      );
      const text = await res.text();
      return { status: res.status, text };
    },
    {
      victimId: SOMEONE_ELSE,
      supabaseUrl:
        process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321",
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    },
  );

  // Either the server rejects (4xx) or returns 2xx with an empty array
  // (RLS silently filters the UPDATE to zero rows). Both pass.
  if (result.status >= 200 && result.status < 300) {
    const body = result.text.trim();
    expect(body === "" || body === "[]").toBe(true);
  } else {
    expect(result.status).toBeGreaterThanOrEqual(400);
    expect(result.status).toBeLessThan(500);
  }
});
