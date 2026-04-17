import { z } from "zod";
import { patientGenderSchema, practiceSettingSchema } from "./enums";

export const feedFiltersSchema = z.object({
  variables: z
    .record(
      z.string().regex(/^[a-z0-9_-]+$/),
      z.array(z.string().max(64)).max(20),
    )
    .default({}),
  submitter_practice_setting: z.array(practiceSettingSchema).default([]),
  patient_age_min: z.number().int().min(0).max(120).optional(),
  patient_age_max: z.number().int().min(0).max(120).optional(),
  patient_gender: z.array(patientGenderSchema).default([]),
});
export type FeedFilters = z.infer<typeof feedFiltersSchema>;

export const EMPTY_FILTERS: FeedFilters = {
  variables: {},
  submitter_practice_setting: [],
  patient_gender: [],
};
