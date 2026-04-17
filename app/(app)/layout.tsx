import { redirect } from "next/navigation";
import { BottomTabBar, BottomTabBarSpacer } from "@/components/ui/tab-bar";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
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

  // Ensure profile exists and role is set — otherwise bounce to setup.
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, disclaimer_acked_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !profile.role || !profile.disclaimer_acked_at) {
    redirect("/profile/setup");
  }

  return (
    <div className="min-h-dvh pb-20">
      <div className="mx-auto max-w-[720px]">{children}</div>
      <BottomTabBarSpacer />
      <BottomTabBar />
    </div>
  );
}
