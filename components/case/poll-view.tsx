import { HorizontalBarChart, type BarChartRow } from "@/components/ui/bar-chart";
import type { DecisionOption } from "@/lib/schemas/variable-field";
import type { VoteAggregate } from "@/lib/schemas/case-vote";

interface Props {
  decisions: DecisionOption[];
  aggregate: VoteAggregate;
}

const OTHER_ID = "other";

export function PollView({ decisions, aggregate }: Props) {
  const ownDecisionId = aggregate.own_vote?.decision_id;

  const distMap = new Map(aggregate.distribution.map((d) => [d.decision_id, d]));

  const rows: BarChartRow[] = decisions.map((d) => {
    const r = distMap.get(d.id);
    return {
      id: d.id,
      label: d.label,
      pct: r?.pct ?? 0,
      count: r?.count ?? 0,
      highlighted: ownDecisionId === d.id,
    };
  });

  const otherRow = distMap.get(OTHER_ID);
  if (otherRow || ownDecisionId === OTHER_ID) {
    rows.push({
      id: OTHER_ID,
      label: "Other",
      pct: otherRow?.pct ?? 0,
      count: otherRow?.count ?? 0,
      highlighted: ownDecisionId === OTHER_ID,
    });
  }

  rows.sort((a, b) => b.pct - a.pct);

  const ownOtherText = aggregate.own_vote?.other_text ?? null;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg bg-surface p-5 shadow-card">
        <div className="mb-4 flex items-baseline justify-between">
          <p className="text-sm font-semibold uppercase tracking-wider text-text-muted">
            Peer results
          </p>
          <p className="text-xs tabular-nums text-text-muted">
            {aggregate.total} {aggregate.total === 1 ? "vote" : "votes"}
          </p>
        </div>
        <HorizontalBarChart rows={rows} />
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
