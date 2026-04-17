import Link from "next/link";
import { ClipboardList, Plus } from "lucide-react";
import { CaseCard } from "@/components/case/case-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/server";
import { renderCaseVariablesTeaser } from "@/lib/case/teaser";
import {
  CATEGORY_LABELS,
  type CaseCategory,
  type PatientGender,
} from "@/lib/schemas/enums";
import {
  variableFieldSchema,
  type VariableField,
} from "@/lib/schemas/variable-field";
import type { Json } from "@/lib/types/database";

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

type MyCaseRow = {
  id: string;
  case_number: number;
  patient_age: number;
  patient_gender: PatientGender;
  case_variables: Json;
  created_at: string;
  case_templates: {
    title: string;
    category: CaseCategory;
    clinical_vignette_structured: Json;
  } | null;
};

export default async function MyCasesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: rawCases } = await supabase
    .from("cases")
    .select(
      "id, case_number, patient_age, patient_gender, case_variables, created_at, case_templates(title, category, clinical_vignette_structured)",
    )
    .eq("submitter_id", user.id)
    .order("created_at", { ascending: false });

  const cases = (rawCases ?? []) as unknown as MyCaseRow[];

  return (
    <main className="px-5 py-6">
      <header className="mb-6 flex flex-col gap-1">
        <p className="label">HISTORY</p>
        <h1 className="text-[28px] font-bold tracking-tight">My cases</h1>
        <p className="text-text-muted">
          Cases you&apos;ve posted. Tap one to see how peers voted.
        </p>
      </header>

      <Button asChild size="lg" block className="mb-5">
        <Link href="/cases/new">
          <Plus size={18} className="mr-2" />
          Add new case
        </Link>
      </Button>

      {cases.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No cases yet"
          description="Post a de-identified case and see what peers would pick."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {cases.map((c) => {
            const template = c.case_templates;
            if (!template) return null;
            const fields = parseArray<VariableField>(
              template.clinical_vignette_structured,
              variableFieldSchema,
            );
            const values = (c.case_variables ?? {}) as Record<string, unknown>;
            return (
              <CaseCard
                key={c.id}
                caseNumber={c.case_number}
                age={c.patient_age}
                gender={c.patient_gender}
                category={CATEGORY_LABELS[template.category]}
                teaser={renderCaseVariablesTeaser(fields, values)}
                isOwn
              />
            );
          })}
        </div>
      )}
    </main>
  );
}
