import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Handles magic-link / recovery / invite callbacks. GoTrue emails the user a
// URL of the form `/auth/callback?token=...&type=magiclink&redirect_to=...`.
// We call verifyOtp with the token to issue a session cookie, then route the
// user to profile setup on first login or to their intended destination.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(/:$/, "");
  const origin = host ? `${proto}://${host}` : request.nextUrl.origin;
  const token = searchParams.get("token_hash") ?? searchParams.get("token");
  const type = searchParams.get("type") ?? "magiclink";
  const next = searchParams.get("next") ?? "/feed";

  if (!token) {
    return NextResponse.redirect(`${origin}/login?error=missing_token`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: token,
    // GoTrue's email uses "magiclink"/"recovery"/"signup"/"invite" which map
    // 1:1 to supabase-js's EmailOtpType union.
    type: type as "magiclink" | "recovery" | "signup" | "invite" | "email",
  });
  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, disclaimer_acked_at")
      .eq("id", user.id)
      .maybeSingle();
    if (!profile || !profile.role || !profile.disclaimer_acked_at) {
      return NextResponse.redirect(
        `${origin}/profile/setup?next=${encodeURIComponent(next)}`,
      );
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
