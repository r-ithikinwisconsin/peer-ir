"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ToggleResult = { ok: true } | { ok: false; error: string };

export async function toggleTemplateActive(
  id: string,
  nextActive: boolean,
): Promise<ToggleResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.is_admin) return { ok: false, error: "Admin required" };

  const { error } = await supabase
    .from("case_templates")
    .update({ is_active: nextActive })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/cases");
  revalidatePath("/feed");
  return { ok: true };
}
