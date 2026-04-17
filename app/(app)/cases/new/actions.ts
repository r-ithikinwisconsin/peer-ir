"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  buildCaseVariablesSchema,
  caseSubmitSchema,
} from "@/lib/schemas/case";
import {
  decisionOptionSchema,
  reasonOptionSchema,
  variableFieldSchema,
  type DecisionOption,
  type ReasonOption,
  type VariableField,
} from "@/lib/schemas/variable-field";

export type CreateCaseResult =
  | { ok: true; caseNumber: number }
  | { ok: false; error: string };

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

export async function createCase(input: {
  age: number;
  gender: "male" | "female" | "other";
  caseVariables: Record<string, unknown>;
  decisionId: string;
  otherText?: string;
  reasonIds: string[];
}): Promise<CreateCaseResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { data: template } = await supabase
    .from("case_templates")
    .select("id, clinical_vignette_structured, decision_options, reason_options, is_active")
    .eq("slug", "pulmonary-embolism")
    .maybeSingle();

  if (!template || !template.is_active) {
    return { ok: false, error: "Case template unavailable" };
  }

  const fields = parseArray<VariableField>(
    template.clinical_vignette_structured,
    variableFieldSchema,
  );
  const decisions = parseArray<DecisionOption>(
    template.decision_options,
    decisionOptionSchema,
  );
  const reasons = parseArray<ReasonOption>(
    template.reason_options,
    reasonOptionSchema,
  );

  const variablesSchema = buildCaseVariablesSchema(fields);
  const parsedVars = variablesSchema.safeParse(input.caseVariables);
  if (!parsedVars.success) {
    return {
      ok: false,
      error: parsedVars.error.issues
        .map((i) => `${i.path.join(".") || "field"}: ${i.message}`)
        .join(", "),
    };
  }

  const isOther = input.decisionId === "other";
  if (!isOther && !decisions.some((d) => d.id === input.decisionId)) {
    return { ok: false, error: "Invalid decision" };
  }
  if (isOther && !input.otherText?.trim()) {
    return { ok: false, error: "Describe your choice" };
  }

  const reasonIdSet = new Set(reasons.map((r) => r.id));
  if (input.reasonIds.some((id) => !reasonIdSet.has(id))) {
    return { ok: false, error: "Invalid reason" };
  }

  const parsed = caseSubmitSchema.safeParse({
    age: input.age,
    gender: input.gender,
    caseVariables: parsedVars.data,
    decisionId: input.decisionId,
    otherText: input.otherText?.trim() || undefined,
    reasonIds: input.reasonIds,
  });
  if (!parsed.success) return { ok: false, error: "Invalid payload" };

  const { data, error } = await supabase.rpc("create_case", {
    p_age: parsed.data.age,
    p_gender: parsed.data.gender,
    p_case_variables: parsed.data.caseVariables,
    p_decision_id: parsed.data.decisionId,
    p_other_text: parsed.data.otherText ?? null,
    p_reason_ids: parsed.data.reasonIds,
  });

  if (error) return { ok: false, error: error.message };
  const payload = data as { case_number: number; case_id: string } | null;
  if (!payload) return { ok: false, error: "Unknown server error" };

  redirect(`/cases/${payload.case_number}`);
}
