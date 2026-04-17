import { z } from "zod";
import { caseCategorySchema } from "./enums";
import {
  decisionOptionSchema,
  reasonOptionSchema,
  variableFieldSchema,
} from "./variable-field";

export const caseTemplateSchema = z.object({
  id: z.string().uuid(),
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, digits, and hyphens only"),
  title: z.string().min(3).max(160),
  category: caseCategorySchema,
  clinical_vignette_structured: z.array(variableFieldSchema).min(1).max(20),
  decision_options: z.array(decisionOptionSchema).min(2).max(12),
  reason_options: z.array(reasonOptionSchema).default([]),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type CaseTemplate = z.infer<typeof caseTemplateSchema>;
