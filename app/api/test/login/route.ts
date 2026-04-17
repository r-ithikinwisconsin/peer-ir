import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/types/database";

export const dynamic = "force-dynamic";

const TEST_PASSWORD = "e2e-test-password-12345";

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const secret = process.env.TEST_LOGIN_SECRET;
  const provided = request.headers.get("x-test-secret");
  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { email?: string; role?: string; is_admin?: boolean; ack_disclaimer?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = body.email;
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Ensure a user with the known test password exists.
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 });
  const existing = list?.users?.find((u) => u.email === email);

  let userId: string | undefined;
  if (existing) {
    userId = existing.id;
    const { error } = await admin.auth.admin.updateUserById(existing.id, {
      password: TEST_PASSWORD,
      email_confirm: true,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      password: TEST_PASSWORD,
      email_confirm: true,
    });
    if (error || !created?.user) {
      return NextResponse.json(
        { error: error?.message ?? "create failed" },
        { status: 500 },
      );
    }
    userId = created.user.id;
  }

  if (!userId) {
    return NextResponse.json({ error: "no user id" }, { status: 500 });
  }

  // Optionally seed profile fields so tests can skip /profile/setup.
  if (body.role || body.ack_disclaimer || body.is_admin) {
    const update: Record<string, unknown> = {};
    if (body.role) update.role = body.role;
    if (body.ack_disclaimer) update.disclaimer_acked_at = new Date().toISOString();
    if (body.is_admin !== undefined) update.is_admin = body.is_admin;
    await admin.from("profiles").upsert({ id: userId, ...update });
  }

  // Sign in on the server with cookie-writing client so the browser gets the
  // session cookie in the response.
  const cookieStore = await cookies();
  const response = NextResponse.json({ ok: true, userId });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Parameters<NonNullable<CookieMethodsServer["setAll"]>>[0]) {
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: TEST_PASSWORD,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return response;
}
