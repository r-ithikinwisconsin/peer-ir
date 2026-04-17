"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DecisionCard } from "@/components/case/decision-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DecisionOption } from "@/lib/schemas/variable-field";
import { submitVote } from "./actions";

interface Props {
  caseId: string;
  caseNumber: number;
  decisions: DecisionOption[];
}

export function VoteForm({ caseId, caseNumber, decisions }: Props) {
  const [decisionId, setDecisionId] = useState<string>("");
  const [otherText, setOtherText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!decisionId) {
      setError("Pick one");
      return;
    }
    if (decisionId === "other" && !otherText.trim()) {
      setError("Describe your pick");
      return;
    }

    start(async () => {
      const res = await submitVote({
        caseId,
        decisionId,
        otherText: decisionId === "other" ? otherText.trim() : undefined,
        caseNumber,
      });
      if (!res.ok) {
        setError(res.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold uppercase tracking-wider text-text-muted">
          What would you pick?
        </p>
        <p className="text-xs text-text-subtle">
          Your choice stays anonymous. You&apos;ll see peer results after voting.
        </p>
      </div>

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
      </div>

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

      {error && (
        <p className="rounded-md bg-[#fef2f2] p-3 text-sm text-[#b91c1c]">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" block disabled={pending}>
        {pending ? "Submitting..." : "Submit vote"}
      </Button>
    </form>
  );
}
