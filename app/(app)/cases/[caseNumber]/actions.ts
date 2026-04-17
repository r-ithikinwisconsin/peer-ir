"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  decisionOptionSchema,
  type DecisionOption,
} from "@/lib/schemas/variable-field";
import { voteSubmitSchema } from "@/lib/schemas/case-vote";

export type VoteResult = { ok: true } | { ok: false; error: string };

function parseArray<T>(
  raw: unknown,
  schema: { safeParse: (input: unknown) => { success: boolean; data?: T } },
): T[] {
  if (!Array.isArray(raw)) return [];
  const out: T[] = [];
  for (const item of raw) {
    const parsed = schema.safeParse(item);
    if (parsed.success && parsed.data !== undefined) out.push(parsed.data);
  }
  return out;
}

export async function submitVote(input: {
  caseId: string;
  decisionId: string;
  otherText?: string;
  caseNumber: number;
}): Promise<VoteResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const parsed = voteSubmitSchema.safeParse({
    caseId: input.caseId,
    decisionId: input.decisionId,
    otherText: input.otherText?.trim() || undefined,
  });
  if (!parsed.success) return { ok: false, error: "Invalid payload" };

  const { data: caseRow } = await supabase
    .from("cases")
    .select("id, case_templates(decision_options)")
    .eq("id", parsed.data.caseId)
    .maybeSingle();

  if (!caseRow) return { ok: false, error: "Case not found" };

  const decisions = parseArray<DecisionOption>(
    (caseRow.case_templates as { decision_options?: unknown } | null)
      ?.decision_options,
    decisionOptionSchema,
  );

  const isOther = parsed.data.decisionId === "other";
  if (!isOther && !decisions.some((d) => d.id === parsed.data.decisionId)) {
    return { ok: false, error: "Invalid decision" };
  }
  if (isOther && !parsed.data.otherText) {
    return { ok: false, error: "Describe your pick" };
  }

  const { error } = await supabase.from("case_votes").insert({
    case_id: parsed.data.caseId,
    voter_id: user.id,
    decision_id: parsed.data.decisionId,
    other_text: parsed.data.otherText ?? null,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "You've already voted on this case." };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath(`/cases/${input.caseNumber}`);
  return { ok: true };
}
