"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Pin the cookie name so the server (using SUPABASE_INTERNAL_URL)
      // and the browser (using NEXT_PUBLIC_SUPABASE_URL) share one cookie
      // rather than deriving divergent names from different hosts.
      cookieOptions: { name: "sb-ir-auth-token" },
    },
  );
}
