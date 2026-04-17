import { notFound } from "next/navigation";
import { CategoryPill } from "@/components/ui/category-pill";
import { PhotoCarousel } from "@/components/case/photo-carousel";
import { PollView } from "@/components/case/poll-view";
import { VignettePanel } from "@/components/case/vignette-panel";
import { buildCasePhotoUrl } from "@/lib/case/photos";
import { createClient } from "@/lib/supabase/server";
import { voteAggregateSchema } from "@/lib/schemas/case-vote";
import {
  CATEGORY_LABELS,
  GENDER_LABELS,
  GENDER_SHORT,
  type CaseCategory,
  type PatientGender,
} from "@/lib/schemas/enums";
import {
  decisionOptionSchema,
  reasonOptionSchema,
  variableFieldSchema,
  type DecisionOption,
  type ReasonOption,
  type VariableField,
} from "@/lib/schemas/variable-field";
import type { Json } from "@/lib/types/database";
import { VoteForm } from "./vote-form";

export const dynamic = "force-dynamic";

function parseArray<T>(
  raw: Json | null | undefined,
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

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ caseNumber: string }>;
}) {
  const { caseNumber: raw } = await params;
  const caseNumber = Number(raw);
  if (!Number.isInteger(caseNumber) || caseNumber <= 0) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: caseRow } = await supabase
    .from("cases")
    .select(
      "id, case_number, submitter_id, patient_age, patient_gender, case_variables, submitter_decision_id, submitter_other_text, submitter_reason_ids, photo_paths, created_at, case_templates(title, category, clinical_vignette_structured, decision_options, reason_options)",
    )
    .eq("case_number", caseNumber)
    .maybeSingle();

  if (!caseRow) notFound();

  const template = caseRow.case_templates as unknown as {
    title: string;
    category: CaseCategory;
    clinical_vignette_structured: Json;
    decision_options: Json;
    reason_options: Json;
  } | null;
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

  const gender = caseRow.patient_gender as PatientGender;

  const { data: aggregateJson } = await supabase.rpc(
    "get_case_vote_aggregate",
    { p_case_id: caseRow.id, p_filters: {} },
  );
  const aggregate = voteAggregateSchema.parse(aggregateJson);

  const hasVoted = aggregate.own_vote !== null;
  const isSubmitter = caseRow.submitter_id === user.id;

  const submitterDecisionLabel =
    caseRow.submitter_decision_id === "other"
      ? `Other: ${caseRow.submitter_other_text ?? ""}`
      : decisions.find((d) => d.id === caseRow.submitter_decision_id)?.label ??
        caseRow.submitter_decision_id;

  const submitterReasonLabels = (caseRow.submitter_reason_ids ?? [])
    .map((id) => reasons.find((r) => r.id === id)?.label)
    .filter((l): l is string => Boolean(l));

  const photoUrls = (caseRow.photo_paths ?? []).map(buildCasePhotoUrl);
  const hasPhotos = photoUrls.length > 0;

  return (
    <main className="px-5 py-6">
      <header className="mb-5 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <CategoryPill>{CATEGORY_LABELS[template.category]}</CategoryPill>
          {isSubmitter && (
            <span className="inline-flex h-6 items-center rounded-full bg-primary-soft px-2 text-[10px] font-bold uppercase tracking-wider text-primary-soft-fg">
              Your case
            </span>
          )}
        </div>
        <h1 className="text-[26px] font-bold tracking-tight">
          Case #{caseRow.case_number}
          <span className="ml-2 font-semibold text-text-muted">
            {caseRow.patient_age}
            {GENDER_SHORT[gender]}
          </span>
        </h1>
        <p className="text-sm text-text-muted">
          {caseRow.patient_age}-year-old {GENDER_LABELS[gender].toLowerCase()} ·{" "}
          {template.title.toLowerCase()}
        </p>
      </header>

      <div
        className={
          hasPhotos
            ? "grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
            : "flex flex-col gap-6"
        }
      >
        {hasPhotos && (
          <div className="md:sticky md:top-6 md:self-start">
            <PhotoCarousel urls={photoUrls} />
          </div>
        )}

        <div className="flex min-w-0 flex-col gap-6">
          <section>
            <VignettePanel
              fields={fields}
              values={caseRow.case_variables as Record<string, unknown>}
            />
          </section>

          {isSubmitter && (
            <section className="rounded-lg bg-chip-bg p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Your decision
              </p>
              <p className="mt-1 text-[15px] font-semibold">
                {submitterDecisionLabel}
              </p>
              {submitterReasonLabels.length > 0 && (
                <p className="mt-1 text-sm text-text-muted">
                  {submitterReasonLabels.join(" · ")}
                </p>
              )}
            </section>
          )}

          {hasVoted ? (
            <PollView
              caseId={caseRow.id}
              decisions={decisions}
              initialAggregate={aggregate}
            />
          ) : (
            <VoteForm
              caseId={caseRow.id}
              caseNumber={caseRow.case_number}
              decisions={decisions}
            />
          )}
        </div>
      </div>
    </main>
  );
}
