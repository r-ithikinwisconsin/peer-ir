import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_admin) {
    return (
      <div className="min-h-dvh pb-20">
        <div className="mx-auto max-w-[720px]">
          <main className="flex min-h-dvh items-center justify-center px-5 py-6">
            <div className="flex w-full max-w-sm flex-col items-center gap-3 rounded-lg bg-surface p-8 text-center shadow-card">
              <h1 className="text-[19px] font-bold tracking-tight">
                Admin access required
              </h1>
              <p className="text-sm text-text-muted">
                You don&rsquo;t have permission to view this area.
              </p>
              <Button asChild variant="secondary" size="md" className="mt-2">
                <Link href="/feed">Back to feed</Link>
              </Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh pb-20">
      <div className="mx-auto max-w-[720px]">
        <header className="flex items-center justify-between px-5 pt-6 pb-2">
          <p className="label">DECIQ &middot; ADMIN</p>
          <Link
            href="/feed"
            className="text-sm font-semibold text-primary hover:underline"
          >
            Back to feed
          </Link>
        </header>
        {children}
      </div>
    </div>
  );
}
