import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  decisionOptionSchema,
  reasonOptionSchema,
  variableFieldSchema,
  type DecisionOption,
  type ReasonOption,
  type VariableField,
} from "@/lib/schemas/variable-field";
import type { Json } from "@/lib/types/database";
import { NewCaseForm } from "./new-case-form";

export const dynamic = "force-dynamic";

function parseArray<T>(
  raw: Json | null,
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

export default async function NewCasePage() {
  const supabase = await createClient();
  const { data: template } = await supabase
    .from("case_templates")
    .select("clinical_vignette_structured, decision_options, reason_options")
    .eq("slug", "pulmonary-embolism")
    .maybeSingle();
  if (!template) notFound();

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

  return (
    <main className="px-5 py-6">
      <header className="mb-6 flex flex-col gap-1">
        <p className="label">NEW CASE</p>
        <h1 className="text-[28px] font-bold tracking-tight">
          Post a pulmonary embolism case
        </h1>
        <p className="text-text-muted">
          De-identified only. No names, dates, or free-text PHI.
        </p>
      </header>
      <NewCaseForm
        fields={fields}
        decisions={decisions}
        reasons={reasons}
      />
    </main>
  );
}
