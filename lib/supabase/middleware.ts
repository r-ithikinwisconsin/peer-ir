import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/types/database";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/auth/callback",
  "/design-system",
  "/robots.txt",
  "/favicon.ico",
];

const AUTHED_ROOT_PATHS = [
  "/feed",
  "/cases",
  "/my-cases",
  "/profile",
  "/admin",
];

function isPublic(path: string) {
  if (PUBLIC_PATHS.includes(path)) return true;
  if (path.startsWith("/_next/")) return true;
  if (path.startsWith("/api/test/")) return true;
  if (path.startsWith("/auth/")) return true;
  return false;
}

function isAuthed(path: string) {
  return AUTHED_ROOT_PATHS.some(
    (p) => path === p || path.startsWith(`${p}/`),
  );
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.SUPABASE_INTERNAL_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { name: "sb-ir-auth-token" },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Parameters<NonNullable<CookieMethodsServer["setAll"]>>[0]) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (!user && isAuthed(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Authed user visiting root marketing — redirect to feed.
  if (user && pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/feed";
    return NextResponse.redirect(url);
  }

  // Authed user visiting login — redirect to feed.
  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/feed";
    return NextResponse.redirect(url);
  }

  return response;
}

export { isPublic, isAuthed };
