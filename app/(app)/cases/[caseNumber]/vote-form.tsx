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
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [showOther, setShowOther] = useState(false);
  const [otherText, setOtherText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [, start] = useTransition();
  const router = useRouter();

  function vote(decisionId: string, text?: string) {
    setError(null);
    setPendingId(decisionId);
    start(async () => {
      const res = await submitVote({
        caseId,
        decisionId,
        otherText: text?.trim() || undefined,
        caseNumber,
      });
      if (!res.ok) {
        setError(res.error);
        setPendingId(null);
      } else {
        router.refresh();
      }
    });
  }

  function submitOther(e: React.FormEvent) {
    e.preventDefault();
    const t = otherText.trim();
    if (!t) {
      setError("Describe your pick");
      return;
    }
    vote("other", t);
  }

  const locked = pendingId !== null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold uppercase tracking-wider text-text-muted">
          What would you pick?
        </p>
        <p className="text-xs text-text-subtle">
          Tap to vote. Peers will see your pick.
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        {decisions.map((d) => (
          <DecisionCard
            key={d.id}
            label={d.label}
            description={d.description}
            selected={pendingId === d.id}
            disabled={locked}
            onClick={() => vote(d.id)}
            className="disabled:cursor-default disabled:opacity-60 aria-[pressed=true]:opacity-100"
          />
        ))}
        <DecisionCard
          label="Other"
          description="Describe your approach"
          selected={showOther || pendingId === "other"}
          disabled={locked && pendingId !== "other"}
          onClick={() => {
            if (locked) return;
            setShowOther(true);
            setError(null);
          }}
          className="disabled:cursor-default disabled:opacity-60 aria-[pressed=true]:opacity-100"
        />
      </div>

      {showOther && (
        <form
          onSubmit={submitOther}
          className="flex flex-col gap-3 rounded-lg bg-surface p-4 shadow-card"
        >
          <Label htmlFor="other">Describe your approach</Label>
          <Input
            id="other"
            autoFocus
            value={otherText}
            onChange={(e) => setOtherText(e.target.value)}
            placeholder="e.g. surgical embolectomy + ECMO"
            maxLength={240}
            disabled={locked}
          />
          <Button
            type="submit"
            size="md"
            disabled={locked || !otherText.trim()}
          >
            {pendingId === "other" ? "Voting..." : "Vote"}
          </Button>
        </form>
      )}

      {error && (
        <p className="rounded-md bg-[#fef2f2] p-3 text-sm text-[#b91c1c]">
          {error}
        </p>
      )}
    </div>
  );
}
