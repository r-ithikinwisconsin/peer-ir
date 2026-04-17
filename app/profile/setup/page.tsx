import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileSetupForm } from "./profile-setup-form";

export const dynamic = "force-dynamic";

export default async function ProfileSetupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <main className="mx-auto max-w-[540px] px-5 py-10">
      <ProfileSetupForm
        initial={{
          display_name: profile?.display_name ?? "",
          role: profile?.role ?? null,
          years_out_of_training: profile?.years_out_of_training ?? null,
          practice_setting: profile?.practice_setting ?? null,
          disclaimer_acked_at: profile?.disclaimer_acked_at ?? null,
        }}
      />
    </main>
  );
}
