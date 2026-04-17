"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DecisionCard } from "@/components/case/decision-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionHeading } from "@/components/ui/section-heading";
import { VariableFieldRenderer } from "@/components/case/variable-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GENDER_LABELS,
  type PatientGender,
} from "@/lib/schemas/enums";
import type {
  DecisionOption,
  ReasonOption,
  VariableField,
} from "@/lib/schemas/variable-field";
import { createCase } from "./actions";

type FieldValue = string | number | string[] | undefined;

interface Props {
  fields: VariableField[];
  decisions: DecisionOption[];
  reasons: ReasonOption[];
}

export function NewCaseForm({ fields, decisions, reasons }: Props) {
  const [age, setAge] = useState<string>("");
  const [gender, setGender] = useState<PatientGender | "">("");
  const [vars, setVars] = useState<Record<string, FieldValue>>({});
  const [decisionId, setDecisionId] = useState<string>("");
  const [otherText, setOtherText] = useState<string>("");
  const [reasonIds, setReasonIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const visibleReasons = reasons.filter(
    (r) =>
      !r.scopedToDecisionIds ||
      (decisionId && r.scopedToDecisionIds.includes(decisionId)),
  );

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const ageNum = Number(age);
    if (!Number.isInteger(ageNum) || ageNum < 0 || ageNum > 120) {
      setError("Enter a valid age");
      return;
    }
    if (!gender) {
      setError("Select gender");
      return;
    }
    if (!decisionId) {
      setError("Pick a decision");
      return;
    }
    if (decisionId === "other" && !otherText.trim()) {
      setError("Describe your pick");
      return;
    }

    const cleanVars: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(vars)) {
      if (v === undefined) continue;
      if (Array.isArray(v) && v.length === 0) continue;
      cleanVars[k] = v;
    }

    start(async () => {
      const res = await createCase({
        age: ageNum,
        gender: gender as PatientGender,
        caseVariables: cleanVars,
        decisionId,
        otherText: decisionId === "other" ? otherText.trim() : undefined,
        reasonIds,
      });
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-7">
      <section>
        <SectionHeading title="Patient" size="sm" />
        <div className="flex flex-col gap-5 rounded-lg bg-surface p-5 shadow-card">
          <div className="flex flex-col gap-2">
            <Label htmlFor="age">
              Age <span className="text-text-subtle">(years)</span>
            </Label>
            <Input
              id="age"
              type="number"
              inputMode="numeric"
              min={0}
              max={120}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g. 68"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Gender</Label>
            <Select
              value={gender}
              onValueChange={(v) => setGender(v as PatientGender)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose one" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(GENDER_LABELS) as PatientGender[]).map((g) => (
                  <SelectItem key={g} value={g}>
                    {GENDER_LABELS[g]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section>
        <SectionHeading title="Clinical picture" size="sm" />
        <div className="flex flex-col gap-5 rounded-lg bg-surface p-5 shadow-card">
          {fields.map((f) => (
            <VariableFieldRenderer
              key={f.id}
              field={f}
              value={vars[f.id]}
              onChange={(v) => setVars((prev) => ({ ...prev, [f.id]: v }))}
            />
          ))}
        </div>
      </section>

      <section>
        <SectionHeading title="Your decision" size="sm" />
        <div className="flex flex-col gap-2.5">
          {decisions.map((d) => (
            <DecisionCard
              key={d.id}
              label={d.label}
              description={d.description}
              selected={decisionId === d.id}
              onClick={() => {
                setDecisionId(d.id);
                setOtherText("");
              }}
            />
          ))}
          <DecisionCard
            label="Other"
            description="Describe your approach"
            selected={decisionId === "other"}
            onClick={() => setDecisionId("other")}
          />
          {decisionId === "other" && (
            <div className="rounded-lg bg-surface p-4 shadow-card">
              <Label htmlFor="other">Describe your approach</Label>
              <Input
                id="other"
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
                placeholder="e.g. surgical embolectomy + ECMO"
                maxLength={240}
                className="mt-2"
              />
            </div>
          )}
        </div>
      </section>

      {decisionId && decisionId !== "other" && visibleReasons.length > 0 && (
        <section>
          <SectionHeading title="Reasons (optional)" size="sm" />
          <div className="flex flex-col gap-1 rounded-lg bg-surface p-1 shadow-card">
            {visibleReasons.map((r) => {
              const checked = reasonIds.includes(r.id);
              return (
                <label
                  key={r.id}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 hover:bg-chip-bg"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(next) => {
                      setReasonIds((prev) =>
                        next ? [...prev, r.id] : prev.filter((x) => x !== r.id),
                      );
                    }}
                  />
                  <span className="text-[15px]">{r.label}</span>
                </label>
              );
            })}
          </div>
        </section>
      )}

      {error && (
        <p className="rounded-md bg-[#fef2f2] p-3 text-sm text-[#b91c1c]">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" block disabled={pending}>
        {pending ? "Submitting..." : "Post case"}
      </Button>
    </form>
  );
}
