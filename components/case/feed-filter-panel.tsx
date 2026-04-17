"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import {
  GENDER_LABELS,
  PRACTICE_SETTING_LABELS,
  type PatientGender,
  type PracticeSetting,
} from "@/lib/schemas/enums";
import type { VariableField } from "@/lib/schemas/variable-field";

const GENDER_KEYS: PatientGender[] = ["male", "female", "other"];
const SETTING_KEYS: PracticeSetting[] = [
  "academic",
  "community",
  "hybrid",
  "private_practice",
  "other",
];

interface Props {
  fields: VariableField[];
  total: number;
  matched: number;
}

function csvToList(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function FeedFilterPanel({ fields, total, matched }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const ageMin = searchParams.get("age_min") ?? "";
  const ageMax = searchParams.get("age_max") ?? "";
  const genders = csvToList(searchParams.get("gender"));
  const settings = csvToList(searchParams.get("setting"));

  const [minDraft, setMinDraft] = useState(ageMin);
  const [maxDraft, setMaxDraft] = useState(ageMax);
  useEffect(() => setMinDraft(ageMin), [ageMin]);
  useEffect(() => setMaxDraft(ageMax), [ageMax]);

  const filterableFields = useMemo(
    () => fields.filter((f) => f.type === "select" || f.type === "multi_select"),
    [fields],
  );

  const activeCount =
    (ageMin ? 1 : 0) +
    (ageMax ? 1 : 0) +
    genders.length +
    settings.length +
    filterableFields.reduce(
      (sum, f) => sum + csvToList(searchParams.get(`v_${f.id}`)).length,
      0,
    );

  const update = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(searchParams.toString());
      if (value.length > 0) next.set(key, value);
      else next.delete(key);
      const qs = next.toString();
      router.replace(`/feed${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router, searchParams],
  );

  const toggleInCsv = useCallback(
    (key: string, value: string) => {
      const current = csvToList(searchParams.get(key));
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      update(key, next.join(","));
    },
    [searchParams, update],
  );

  const clearAll = useCallback(() => {
    router.replace("/feed", { scroll: false });
  }, [router]);

  return (
    <div className="rounded-lg bg-surface shadow-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-text-muted" />
          <span className="text-sm font-semibold">
            Filters
            {activeCount > 0 && (
              <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-soft px-1.5 text-[11px] font-bold text-primary-soft-fg">
                {activeCount}
              </span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span className="tabular-nums">
            {matched} of {total}
          </span>
          <ChevronDown
            size={16}
            className={cn("transition-transform", open && "rotate-180")}
          />
        </div>
      </button>

      {open && (
        <div className="flex flex-col gap-5 border-t border-border px-4 py-4">
          <Section title="Patient age (years)">
            <div className="flex items-center gap-3">
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                max={120}
                placeholder="Min"
                value={minDraft}
                onChange={(e) => setMinDraft(e.target.value)}
                onBlur={() => update("age_min", minDraft)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                }}
                className="h-10"
              />
              <span className="text-text-muted">—</span>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                max={120}
                placeholder="Max"
                value={maxDraft}
                onChange={(e) => setMaxDraft(e.target.value)}
                onBlur={() => update("age_max", maxDraft)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                }}
                className="h-10"
              />
            </div>
          </Section>

          <Section title="Patient gender">
            <div className="flex flex-wrap gap-2">
              {GENDER_KEYS.map((g) => (
                <Chip
                  key={g}
                  selected={genders.includes(g)}
                  onClick={() => toggleInCsv("gender", g)}
                >
                  {GENDER_LABELS[g]}
                </Chip>
              ))}
            </div>
          </Section>

          <Section title="Submitter practice setting">
            <div className="flex flex-wrap gap-2">
              {SETTING_KEYS.map((s) => (
                <Chip
                  key={s}
                  selected={settings.includes(s)}
                  onClick={() => toggleInCsv("setting", s)}
                >
                  {PRACTICE_SETTING_LABELS[s]}
                </Chip>
              ))}
            </div>
          </Section>

          {filterableFields.map((f) => {
            if (f.type !== "select" && f.type !== "multi_select") return null;
            const selected = csvToList(searchParams.get(`v_${f.id}`));
            return (
              <Section key={f.id} title={f.label}>
                <div className="flex flex-wrap gap-2">
                  {f.options.map((o) => (
                    <Chip
                      key={o.id}
                      selected={selected.includes(o.id)}
                      onClick={() => toggleInCsv(`v_${f.id}`, o.id)}
                    >
                      {o.label}
                    </Chip>
                  ))}
                </div>
              </Section>
            );
          })}

          {activeCount > 0 && (
            <div className="flex justify-end pt-1">
              <Button variant="ghost" size="sm" onClick={clearAll}>
                Clear all
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
        {title}
      </p>
      {children}
    </div>
  );
}
