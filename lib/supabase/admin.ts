import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

/**
 * Server-side admin client using the service role key.
 *
 * RULES
 *   - NEVER import from client components.
 *   - Used only by:
 *       - scripts/seed.ts
 *       - /api/test/* routes (test-only login bypass)
 *   - Application code always goes through the RLS-enforced client.
 */
export function createAdminClient() {
  const url =
    process.env.SUPABASE_INTERNAL_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for admin client");
  }
  return createSupabaseClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
