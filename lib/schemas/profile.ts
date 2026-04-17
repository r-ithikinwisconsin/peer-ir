import { z } from "zod";
import { practiceSettingSchema, userRoleSchema } from "./enums";

export const profileUpdateSchema = z.object({
  display_name: z
    .string()
    .trim()
    .max(80)
    .nullish()
    .transform((v) => (v === "" ? null : v)),
  role: userRoleSchema.nullish(),
  years_out_of_training: z
    .number()
    .int()
    .min(0)
    .max(60)
    .nullish(),
  practice_setting: practiceSettingSchema.nullish(),
  is_anonymous_public: z.boolean().optional(),
});
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;
