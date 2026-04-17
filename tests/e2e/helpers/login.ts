import type { Page, APIRequestContext } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

interface LoginOptions {
  role?: "attending" | "fellow" | "resident" | "medical_student" | "other";
  is_admin?: boolean;
  ack_disclaimer?: boolean;
}

let cachedSecret: string | null = null;

function readEnvSecret(): string {
  if (cachedSecret) return cachedSecret;
  if (process.env.TEST_LOGIN_SECRET) {
    cachedSecret = process.env.TEST_LOGIN_SECRET;
    return cachedSecret;
  }
  const envPath = join(process.cwd(), ".env.local");
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^TEST_LOGIN_SECRET=(.*)$/);
    if (m) {
      cachedSecret = m[1].trim();
      return cachedSecret;
    }
  }
  throw new Error("TEST_LOGIN_SECRET not found in .env.local");
}

export function uniqueTestEmail(tag: string): string {
  return `e2e-${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@seed.local`;
}

export async function loginAs(
  page: Page,
  email: string,
  opts: LoginOptions = {},
): Promise<void> {
  const secret = readEnvSecret();
  // Use the browser context's request client so cookies land in the page.
  const res = await page.request.post("/api/test/login", {
    headers: {
      "content-type": "application/json",
      "x-test-secret": secret,
    },
    data: {
      email,
      role: opts.role ?? "attending",
      is_admin: opts.is_admin ?? false,
      ack_disclaimer: opts.ack_disclaimer ?? true,
    },
  });
  if (!res.ok()) {
    const text = await res.text();
    throw new Error(`loginAs failed: ${res.status()} ${text}`);
  }
}

export async function loginWithoutProfile(
  page: Page,
  email: string,
): Promise<void> {
  const secret = readEnvSecret();
  const res = await page.request.post("/api/test/login", {
    headers: {
      "content-type": "application/json",
      "x-test-secret": secret,
    },
    data: { email },
  });
  if (!res.ok()) {
    const text = await res.text();
    throw new Error(`loginWithoutProfile failed: ${res.status()} ${text}`);
  }
}

export async function loginViaRequest(
  request: APIRequestContext,
  email: string,
  opts: LoginOptions = {},
): Promise<void> {
  const secret = readEnvSecret();
  const res = await request.post("/api/test/login", {
    headers: {
      "content-type": "application/json",
      "x-test-secret": secret,
    },
    data: {
      email,
      role: opts.role ?? "attending",
      is_admin: opts.is_admin ?? false,
      ack_disclaimer: opts.ack_disclaimer ?? true,
    },
  });
  if (!res.ok()) {
    const text = await res.text();
    throw new Error(`loginViaRequest failed: ${res.status()} ${text}`);
  }
}
