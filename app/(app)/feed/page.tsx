import { notFound } from "next/navigation";
import { Inbox } from "lucide-react";
import { CaseCard } from "@/components/case/case-card";
import { FeedFilterPanel } from "@/components/case/feed-filter-panel";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/server";
import { buildCasePhotoUrl } from "@/lib/case/photos";
import { renderCaseVariablesTeaser } from "@/lib/case/teaser";
import {
  CATEGORY_LABELS,
  patientGenderSchema,
  practiceSettingSchema,
  type CaseCategory,
  type PatientGender,
  type PracticeSetting,
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

function firstString(raw: string | string[] | undefined): string | undefined {
  if (!raw) return undefined;
  return Array.isArray(raw) ? raw[0] : raw;
}

function csv(raw: string | string[] | undefined): string[] {
  const s = firstString(raw);
  if (!s) return [];
  return s
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function parseAge(raw: string | string[] | undefined): number | undefined {
  const s = firstString(raw);
  if (!s) return undefined;
  const n = Number(s);
  return Number.isInteger(n) && n >= 0 && n <= 120 ? n : undefined;
}

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const ageMin = parseAge(params.age_min);
  const ageMax = parseAge(params.age_max);
  const genders = csv(params.gender).filter((g): g is PatientGender =>
    patientGenderSchema.safeParse(g).success,
  );
  const settings = csv(params.setting).filter((s): s is PracticeSetting =>
    practiceSettingSchema.safeParse(s).success,
  );

  const variableFilters: Record<string, string[]> = {};
  for (const [key, raw] of Object.entries(params)) {
    if (!key.startsWith("v_")) continue;
    const fieldId = key.slice(2);
    if (!/^[a-z0-9_-]+$/.test(fieldId)) continue;
    const vals = csv(raw);
    if (vals.length) variableFilters[fieldId] = vals;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: template } = await supabase
    .from("case_templates")
    .select("id, title, category, clinical_vignette_structured")
    .eq("slug", "pulmonary-embolism")
    .maybeSingle();
  if (!template) notFound();

  const fields = parseArray<VariableField>(
    template.clinical_vignette_structured,
    variableFieldSchema,
  );

  type CaseFeedRow = {
    id: string;
    case_number: number;
    submitter_id: string;
    patient_age: number;
    patient_gender: PatientGender;
    case_variables: Json;
    photo_paths: string[] | null;
    created_at: string;
    profiles: { practice_setting: PracticeSetting | null } | null;
  };

  let query = supabase
    .from("cases")
    .select(
      "id, case_number, submitter_id, patient_age, patient_gender, case_variables, photo_paths, created_at, profiles!cases_submitter_id_fkey(practice_setting)",
    )
    .eq("case_template_id", template.id)
    .order("created_at", { ascending: false })
    .limit(200);

  if (ageMin !== undefined) query = query.gte("patient_age", ageMin);
  if (ageMax !== undefined) query = query.lte("patient_age", ageMax);
  if (genders.length > 0) query = query.in("patient_gender", genders);

  const { data: rawCases } = await query;
  const allCases = (rawCases ?? []) as unknown as CaseFeedRow[];

  const filteredCases = allCases.filter((c) => {
    if (settings.length > 0) {
      const ps = c.profiles?.practice_setting;
      if (!ps || !settings.includes(ps)) return false;
    }
    const vars = (c.case_variables ?? {}) as Record<string, unknown>;
    for (const [fieldId, vals] of Object.entries(variableFilters)) {
      const raw = vars[fieldId];
      if (Array.isArray(raw)) {
        if (!vals.some((v) => raw.includes(v))) return false;
      } else if (typeof raw === "string") {
        if (!vals.includes(raw)) return false;
      } else {
        return false;
      }
    }
    return true;
  });

  const { data: votes } = await supabase
    .from("case_votes")
    .select("case_id")
    .eq("voter_id", user.id);
  const votedCaseIds = new Set((votes ?? []).map((v) => v.case_id));

  const categoryLabel = CATEGORY_LABELS[template.category as CaseCategory];

  return (
    <main className="px-5 py-6">
      <header className="mb-6 flex flex-col gap-1">
        <p className="label">FEED</p>
        <h1 className="text-[28px] font-bold tracking-tight">Cases</h1>
        <p className="text-text-muted">
          Real decisions from peers. Pick what you&apos;d do.
        </p>
      </header>

      <div className="mb-5">
        <FeedFilterPanel
          fields={fields}
          total={allCases.length}
          matched={filteredCases.length}
        />
      </div>

      {filteredCases.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={allCases.length === 0 ? "No cases yet" : "No cases match"}
          description={
            allCases.length === 0
              ? "Post the first case from My Cases."
              : "Try clearing some filters."
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {filteredCases.map((c) => {
            const values = (c.case_variables ?? {}) as Record<string, unknown>;
            const photos = c.photo_paths ?? [];
            return (
              <CaseCard
                key={c.id}
                caseNumber={c.case_number}
                age={c.patient_age}
                gender={c.patient_gender}
                category={categoryLabel}
                teaser={renderCaseVariablesTeaser(fields, values)}
                thumbnailUrl={photos[0] ? buildCasePhotoUrl(photos[0]) : undefined}
                photoCount={photos.length}
                isOwn={c.submitter_id === user.id}
                hasVoted={votedCaseIds.has(c.id)}
              />
            );
          })}
        </div>
      )}
    </main>
  );
}
