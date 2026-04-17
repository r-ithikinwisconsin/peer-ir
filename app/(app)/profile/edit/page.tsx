import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ProfileEditForm } from "./profile-edit-form";

export const dynamic = "force-dynamic";

export default async function ProfileEditPage() {
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
    <main className="px-5 py-6">
      <Link
        href="/profile"
        className="-ml-1 mb-4 inline-flex items-center gap-1 text-sm font-semibold text-primary"
      >
        <ChevronLeft size={18} /> Profile
      </Link>
      <header className="mb-5 flex flex-col gap-1">
        <p className="label">EDIT</p>
        <h1 className="text-[28px] font-bold tracking-tight">Your profile</h1>
      </header>
      <ProfileEditForm
        initial={{
          display_name: profile?.display_name ?? "",
          role: profile?.role ?? null,
          years_out_of_training: profile?.years_out_of_training ?? null,
          practice_setting: profile?.practice_setting ?? null,
          institution: profile?.institution ?? "",
        }}
      />
    </main>
  );
}
