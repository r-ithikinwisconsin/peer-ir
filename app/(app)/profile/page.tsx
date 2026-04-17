import Link from "next/link";
import { Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/avatar";
import { CaseCard } from "@/components/case/case-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { StatTile } from "@/components/ui/stat-tile";
import {
  CATEGORY_LABELS,
  PRACTICE_SETTING_LABELS,
  ROLE_LABELS,
  type CaseCategory,
  type PatientGender,
  type PracticeSetting,
  type UserRole,
} from "@/lib/schemas/enums";
import {
  variableFieldSchema,
  type VariableField,
} from "@/lib/schemas/variable-field";
import { renderCaseVariablesTeaser } from "@/lib/case/teaser";
import type { Json } from "@/lib/types/database";

export const dynamic = "force-dynamic";

function parseFields(raw: Json | null): VariableField[] {
  if (!Array.isArray(raw)) return [];
  const out: VariableField[] = [];
  for (const item of raw) {
    const parsed = variableFieldSchema.safeParse(item);
    if (parsed.success) out.push(parsed.data);
  }
  return out;
}

type RecentCase = {
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

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [
    { data: profile },
    { data: rawCases, count: casesPosted },
    { data: votes, count: votesCast },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("cases")
      .select(
        "id, case_number, patient_age, patient_gender, case_variables, created_at, case_templates(title, category, clinical_vignette_structured)",
        { count: "exact" },
      )
      .eq("submitter_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("case_votes")
      .select("created_at", { count: "exact" })
      .eq("voter_id", user.id),
  ]);

  const daySet = new Set<string>();
  for (const v of votes ?? []) {
    daySet.add(new Date(v.created_at).toISOString().slice(0, 10));
  }
  const daysActive = daySet.size;

  const roleLabel = profile?.role
    ? ROLE_LABELS[profile.role as UserRole]
    : "Unspecified role";
  const settingLabel = profile?.practice_setting
    ? PRACTICE_SETTING_LABELS[profile.practice_setting as PracticeSetting]
    : null;
  const institution = profile?.institution ?? null;
  const subtitle = [roleLabel, settingLabel].filter(Boolean).join(" · ");

  const recent = (rawCases ?? []) as unknown as RecentCase[];

  return (
    <main className="px-5 py-6">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={profile?.display_name ?? null} size={64} />
          <div className="flex flex-col">
            <p className="text-[22px] font-bold tracking-tight">
              {profile?.display_name ?? "Anonymous"}
            </p>
            <p className="text-sm text-text-muted">{subtitle}</p>
            {institution && (
              <p className="text-sm text-text-muted">{institution}</p>
            )}
          </div>
        </div>
        <Link
          href="/profile/edit"
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-sm font-semibold text-primary hover:border-primary/40"
        >
          <Pencil size={14} /> Edit
        </Link>
      </header>

      <div className="mb-7 grid grid-cols-3 gap-3">
        <StatTile value={casesPosted ?? 0} label="POSTED" />
        <StatTile value={votesCast ?? 0} label="VOTES" />
        <StatTile value={daysActive} label="DAYS ACTIVE" />
      </div>

      <section>
        <SectionHeading title="Recent cases" size="sm" />
        {recent.length === 0 ? (
          <p className="rounded-lg bg-surface p-5 text-sm text-text-muted shadow-card">
            You haven&apos;t posted a case yet.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {recent.map((r) => {
              const t = r.case_templates;
              if (!t) return null;
              const fields = parseFields(t.clinical_vignette_structured);
              const values = (r.case_variables ?? {}) as Record<string, unknown>;
              return (
                <CaseCard
                  key={r.id}
                  caseNumber={r.case_number}
                  age={r.patient_age}
                  gender={r.patient_gender}
                  category={CATEGORY_LABELS[t.category]}
                  teaser={renderCaseVariablesTeaser(fields, values)}
                  isOwn
                />
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
