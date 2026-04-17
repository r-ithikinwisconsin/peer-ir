import { z } from "zod";

export const voteSubmitSchema = z.object({
  caseId: z.string().uuid(),
  decisionId: z.string().regex(/^[a-z0-9_-]+$/).min(1).max(64),
  otherText: z.string().trim().max(240).optional(),
});
export type VoteSubmit = z.infer<typeof voteSubmitSchema>;

export const voteAggregateSchema = z.object({
  total: z.number().int(),
  distribution: z.array(
    z.object({
      decision_id: z.string(),
      count: z.number().int(),
      pct: z.number(),
    }),
  ),
  other_texts: z.array(z.string()),
  own_vote: z
    .object({
      decision_id: z.string(),
      other_text: z.string().nullable(),
    })
    .nullable(),
});
export type VoteAggregate = z.infer<typeof voteAggregateSchema>;
