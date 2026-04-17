import { z } from "zod";
import { practiceSettingSchema, userRoleSchema } from "./enums";

export const voteSubmitSchema = z.object({
  caseId: z.string().uuid(),
  decisionId: z.string().regex(/^[a-z0-9_-]+$/).min(1).max(64),
  otherText: z.string().trim().max(240).optional(),
});
export type VoteSubmit = z.infer<typeof voteSubmitSchema>;

export const voteAggregateFiltersSchema = z.object({
  roles: z.array(userRoleSchema).optional(),
  practice_settings: z.array(practiceSettingSchema).optional(),
  years_min: z.number().int().min(0).max(60).optional(),
  years_max: z.number().int().min(0).max(60).optional(),
  institution_query: z.string().trim().max(120).optional(),
  name_query: z.string().trim().max(80).optional(),
});
export type VoteAggregateFilters = z.infer<typeof voteAggregateFiltersSchema>;

export const voterSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  role: userRoleSchema.nullable(),
  years_out_of_training: z.number().int().nullable(),
  practice_setting: practiceSettingSchema.nullable(),
  institution: z.string().nullable(),
});
export type Voter = z.infer<typeof voterSchema>;

export const voteAggregateSchema = z.object({
  total: z.number().int(),
  total_unfiltered: z.number().int(),
  distribution: z.array(
    z.object({
      decision_id: z.string(),
      count: z.number().int(),
      pct: z.number(),
      voters: z.array(voterSchema),
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
