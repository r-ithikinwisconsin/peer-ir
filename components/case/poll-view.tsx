"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import {
  BottomSheet,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetTitle,
  BottomSheetTrigger,
} from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FilterSection } from "@/components/ui/filter-section";
import { Input } from "@/components/ui/input";
import { NumberRangeInput } from "@/components/ui/number-range-input";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/browser";
import {
  voteAggregateSchema,
  type VoteAggregate,
  type VoteAggregateFilters,
  type Voter,
} from "@/lib/schemas/case-vote";
import type { Json } from "@/lib/types/database";
import {
  PRACTICE_SETTING_LABELS,
  ROLE_LABELS,
  type PracticeSetting,
  type UserRole,
} from "@/lib/schemas/enums";
import type { DecisionOption } from "@/lib/schemas/variable-field";

interface Props {
  caseId: string;
  decisions: DecisionOption[];
  initialAggregate: VoteAggregate;
}

const OTHER_ID = "other";
const ROLE_OPTIONS: UserRole[] = [
  "attending",
  "fellow",
  "resident",
  "medical_student",
  "other",
];
const SETTING_OPTIONS: PracticeSetting[] = [
  "academic",
  "community",
  "hybrid",
  "private_practice",
  "other",
];

interface Row {
  id: string;
  label: string;
  pct: number;
  count: number;
  voters: Voter[];
  highlighted: boolean;
}

export function PollView({ caseId, decisions, initialAggregate }: Props) {
  const [filters, setFilters] = useState<VoteAggregateFilters>({});
  const [aggregate, setAggregate] = useState<VoteAggregate>(initialAggregate);
  const [pending, start] = useTransition();
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!hasActiveFilters(filters) && aggregate === initialAggregate) return;
    const t = setTimeout(() => {
      start(async () => {
        const supabase = createClient();
        const { data, error } = await supabase.rpc("get_case_vote_aggregate", {
          p_case_id: caseId,
          p_filters: filtersToJson(filters),
        });
        if (error) return;
        const parsed = voteAggregateSchema.safeParse(data);
        if (parsed.success) setAggregate(parsed.data);
      });
    }, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, caseId]);

  const ownDecisionId = aggregate.own_vote?.decision_id;
  const ownOtherText = aggregate.own_vote?.other_text ?? null;

  const rows: Row[] = useMemo(() => {
    const distMap = new Map(aggregate.distribution.map((d) => [d.decision_id, d]));
    const base: Row[] = decisions.map((d) => {
      const r = distMap.get(d.id);
      return {
        id: d.id,
        label: d.label,
        pct: r?.pct ?? 0,
        count: r?.count ?? 0,
        voters: r?.voters ?? [],
        highlighted: ownDecisionId === d.id,
      };
    });
    const other = distMap.get(OTHER_ID);
    if (other || ownDecisionId === OTHER_ID) {
      base.push({
        id: OTHER_ID,
        label: "Other",
        pct: other?.pct ?? 0,
        count: other?.count ?? 0,
        voters: other?.voters ?? [],
        highlighted: ownDecisionId === OTHER_ID,
      });
    }
    return base.sort((a, b) => b.pct - a.pct);
  }, [aggregate, decisions, ownDecisionId]);

  const activeCount = countActiveFilters(filters);
  const filtered = aggregate.total !== aggregate.total_unfiltered;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg bg-surface p-5 shadow-card">
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <p className="text-sm font-semibold uppercase tracking-wider text-text-muted">
            Peer results
          </p>
          <div className="flex items-center gap-2">
            <p className="text-xs tabular-nums text-text-muted">
              {filtered
                ? `${aggregate.total} of ${aggregate.total_unfiltered}`
                : `${aggregate.total} ${aggregate.total === 1 ? "vote" : "votes"}`}
            </p>
            <FilterTrigger
              filters={filters}
              onChange={setFilters}
              activeCount={activeCount}
            />
          </div>
        </div>

        <ul className="flex flex-col gap-4">
          {rows.map((row) => (
            <PollRow
              key={row.id}
              row={row}
              open={expanded === row.id}
              onToggle={() =>
                setExpanded((prev) => (prev === row.id ? null : row.id))
              }
              dim={pending}
            />
          ))}
        </ul>
      </div>

      {ownDecisionId === OTHER_ID && ownOtherText && (
        <div className="rounded-lg bg-primary-soft p-4 text-sm text-primary-soft-fg">
          <p className="font-semibold">Your note</p>
          <p className="mt-1">{ownOtherText}</p>
        </div>
      )}

      {aggregate.other_texts.length > 0 && (
        <details className="rounded-lg bg-surface p-4 shadow-card">
          <summary className="cursor-pointer text-sm font-semibold">
            {aggregate.other_texts.length} other{" "}
            {aggregate.other_texts.length === 1 ? "pick" : "picks"}
          </summary>
          <ul className="mt-3 flex flex-col gap-2 text-sm text-text-muted">
            {aggregate.other_texts.map((t, i) => (
              <li key={i} className="rounded bg-chip-bg px-3 py-2">
                {t}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function PollRow({
  row,
  open,
  onToggle,
  dim,
}: {
  row: Row;
  open: boolean;
  onToggle: () => void;
  dim: boolean;
}) {
  const widthPct = Math.max(0, Math.min(100, row.pct));
  const previewVoters = row.voters.slice(0, 3);
  const hasVoters = row.count > 0;
  return (
    <li
      className={cn(
        "transition-opacity",
        dim && "opacity-60",
      )}
    >
      <button
        type="button"
        onClick={hasVoters ? onToggle : undefined}
        disabled={!hasVoters}
        aria-expanded={open}
        className="block w-full text-left"
      >
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={cn(
                "truncate text-[15px]",
                row.highlighted ? "font-semibold" : "font-medium",
              )}
            >
              {row.label}
            </span>
            {row.highlighted && (
              <span className="inline-flex h-5 shrink-0 items-center rounded-full bg-primary-soft px-2 text-[10px] font-bold uppercase tracking-wider text-primary-soft-fg">
                You
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {previewVoters.length > 0 && (
              <AvatarStack voters={previewVoters} />
            )}
            <span className="tabular-nums text-[13px] font-semibold text-text">
              {row.count}
            </span>
            {hasVoters && (
              <ChevronDown
                size={14}
                className={cn(
                  "text-text-subtle transition-transform duration-200",
                  open && "rotate-180",
                )}
              />
            )}
          </div>
        </div>
        <div
          className={cn(
            "h-2 w-full overflow-hidden rounded-full bg-chip-bg",
            row.highlighted && "ring-1 ring-primary/30",
          )}
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
            style={{ width: `${widthPct}%` }}
          />
        </div>
        <div className="mt-1 flex items-baseline justify-end">
          <span
            className={cn(
              "tabular-nums text-xs",
              row.highlighted ? "font-semibold text-primary" : "text-text-muted",
            )}
          >
            {widthPct.toFixed(0)}%
          </span>
        </div>
      </button>
      {open && hasVoters && <VoterList voters={row.voters} />}
    </li>
  );
}

function AvatarStack({ voters }: { voters: Voter[] }) {
  return (
    <div className="flex -space-x-1.5">
      {voters.map((v) => (
        <Avatar
          key={v.id}
          name={v.name}
          size={22}
          className="border border-surface"
        />
      ))}
    </div>
  );
}

function VoterList({ voters }: { voters: Voter[] }) {
  return (
    <ul className="mt-3 flex flex-col gap-2 rounded-md bg-chip-bg p-2">
      {voters.map((v) => (
        <li key={v.id} className="flex items-center gap-3 px-1 py-1">
          <Avatar name={v.name} size={32} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{v.name}</p>
            <p className="truncate text-xs text-text-muted">
              {voterSubtitle(v)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function voterSubtitle(v: Voter): string {
  const parts: string[] = [];
  if (v.role) parts.push(ROLE_LABELS[v.role]);
  if (v.practice_setting) parts.push(PRACTICE_SETTING_LABELS[v.practice_setting]);
  if (v.years_out_of_training != null) {
    parts.push(
      `${v.years_out_of_training} yr${v.years_out_of_training === 1 ? "" : "s"} out`,
    );
  }
  if (v.institution) parts.push(v.institution);
  return parts.join(" · ") || "Peer";
}

function FilterTrigger({
  filters,
  onChange,
  activeCount,
}: {
  filters: VoteAggregateFilters;
  onChange: (f: VoteAggregateFilters) => void;
  activeCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<VoteAggregateFilters>(filters);

  useEffect(() => {
    if (open) setDraft(filters);
  }, [open, filters]);

  function apply() {
    onChange(draft);
    setOpen(false);
  }

  function clear() {
    const empty: VoteAggregateFilters = {};
    setDraft(empty);
    onChange(empty);
    setOpen(false);
  }

  return (
    <BottomSheet open={open} onOpenChange={setOpen}>
      <BottomSheetTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-xs font-semibold transition-colors",
            activeCount > 0
              ? "bg-primary text-primary-fg"
              : "bg-chip-bg text-text-muted hover:bg-border",
          )}
        >
          <SlidersHorizontal size={12} strokeWidth={2.5} />
          Filters
          {activeCount > 0 && (
            <span className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-fg/25 px-1 text-[10px]">
              {activeCount}
            </span>
          )}
        </button>
      </BottomSheetTrigger>
      <BottomSheetContent>
        <div className="mb-3 flex items-center justify-between">
          <BottomSheetTitle className="text-base font-bold">
            Filter peers
          </BottomSheetTitle>
          <BottomSheetClose asChild>
            <button
              type="button"
              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-text-muted hover:bg-chip-bg"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </BottomSheetClose>
        </div>

        <FilterSection
          title="Doctor name"
          activeCount={draft.name_query ? 1 : 0}
        >
          <Input
            placeholder="Search by name"
            value={draft.name_query ?? ""}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                name_query: e.target.value || undefined,
              }))
            }
            maxLength={80}
          />
        </FilterSection>

        <FilterSection
          title="Institution"
          activeCount={draft.institution_query ? 1 : 0}
        >
          <Input
            placeholder="Search by institution"
            value={draft.institution_query ?? ""}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                institution_query: e.target.value || undefined,
              }))
            }
            maxLength={120}
          />
        </FilterSection>

        <FilterSection title="Role" activeCount={draft.roles?.length ?? 0}>
          <CheckboxGroup
            options={ROLE_OPTIONS}
            labels={ROLE_LABELS}
            selected={draft.roles ?? []}
            onChange={(roles) =>
              setDraft((d) => ({ ...d, roles: roles.length ? roles : undefined }))
            }
          />
        </FilterSection>

        <FilterSection
          title="Practice setting"
          activeCount={draft.practice_settings?.length ?? 0}
        >
          <CheckboxGroup
            options={SETTING_OPTIONS}
            labels={PRACTICE_SETTING_LABELS}
            selected={draft.practice_settings ?? []}
            onChange={(practice_settings) =>
              setDraft((d) => ({
                ...d,
                practice_settings: practice_settings.length
                  ? practice_settings
                  : undefined,
              }))
            }
          />
        </FilterSection>

        <FilterSection
          title="Years out of training"
          activeCount={
            (draft.years_min != null ? 1 : 0) + (draft.years_max != null ? 1 : 0)
          }
        >
          <NumberRangeInput
            min={0}
            max={60}
            unit="yrs"
            value={{ min: draft.years_min, max: draft.years_max }}
            onChange={(v) =>
              setDraft((d) => ({
                ...d,
                years_min: v.min,
                years_max: v.max,
              }))
            }
          />
        </FilterSection>

        <div className="mt-4 flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="md"
            className="flex-1"
            onClick={clear}
          >
            Clear
          </Button>
          <Button type="button" size="md" className="flex-1" onClick={apply}>
            Apply
          </Button>
        </div>
      </BottomSheetContent>
    </BottomSheet>
  );
}

function CheckboxGroup<T extends string>({
  options,
  labels,
  selected,
  onChange,
}: {
  options: readonly T[];
  labels: Record<T, string>;
  selected: T[];
  onChange: (next: T[]) => void;
}) {
  function toggle(opt: T) {
    onChange(
      selected.includes(opt)
        ? selected.filter((s) => s !== opt)
        : [...selected, opt],
    );
  }
  return (
    <ul className="flex flex-col gap-2">
      {options.map((opt) => {
        const checked = selected.includes(opt);
        return (
          <li key={opt}>
            <label className="flex cursor-pointer items-center gap-3 py-1">
              <Checkbox
                checked={checked}
                onCheckedChange={() => toggle(opt)}
              />
              <span className="text-[15px]">{labels[opt]}</span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}

function hasActiveFilters(f: VoteAggregateFilters): boolean {
  return (
    (f.roles?.length ?? 0) > 0 ||
    (f.practice_settings?.length ?? 0) > 0 ||
    f.years_min != null ||
    f.years_max != null ||
    !!f.institution_query ||
    !!f.name_query
  );
}

function countActiveFilters(f: VoteAggregateFilters): number {
  let n = 0;
  if (f.roles?.length) n += 1;
  if (f.practice_settings?.length) n += 1;
  if (f.years_min != null || f.years_max != null) n += 1;
  if (f.institution_query) n += 1;
  if (f.name_query) n += 1;
  return n;
}

function filtersToJson(f: VoteAggregateFilters): Json {
  const out: { [k: string]: Json } = {};
  if (f.roles?.length) out.roles = f.roles;
  if (f.practice_settings?.length) out.practice_settings = f.practice_settings;
  if (f.years_min != null) out.years_min = f.years_min;
  if (f.years_max != null) out.years_max = f.years_max;
  if (f.institution_query) out.institution_query = f.institution_query;
  if (f.name_query) out.name_query = f.name_query;
  return out;
}
