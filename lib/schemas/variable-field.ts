import { z } from "zod";

export const fieldIdSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9_-]+$/, "Use lowercase letters, numbers, underscore, hyphen");

export const optionSchema = z.object({
  id: fieldIdSchema,
  label: z.string().min(1).max(120),
});

export const selectFieldSchema = z.object({
  type: z.literal("select"),
  id: fieldIdSchema,
  label: z.string().min(1).max(160),
  help: z.string().max(240).optional(),
  required: z.boolean().default(true),
  options: z.array(optionSchema).min(2).max(20),
});

export const multiSelectFieldSchema = z.object({
  type: z.literal("multi_select"),
  id: fieldIdSchema,
  label: z.string().min(1).max(160),
  help: z.string().max(240).optional(),
  required: z.boolean().default(false),
  minSelected: z.number().int().min(0).default(0),
  options: z.array(optionSchema).min(2).max(20),
});

export const numberRangeFieldSchema = z.object({
  type: z.literal("number_range"),
  id: fieldIdSchema,
  label: z.string().min(1).max(160),
  help: z.string().max(240).optional(),
  required: z.boolean().default(true),
  unit: z.string().max(16).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().positive().optional(),
});

export const variableFieldSchema = z.discriminatedUnion("type", [
  selectFieldSchema,
  multiSelectFieldSchema,
  numberRangeFieldSchema,
]);
export type VariableField = z.infer<typeof variableFieldSchema>;

export const decisionOptionSchema = z.object({
  id: fieldIdSchema,
  label: z.string().min(1).max(120),
  description: z.string().max(240).optional(),
});
export type DecisionOption = z.infer<typeof decisionOptionSchema>;

export const reasonOptionSchema = z.object({
  id: fieldIdSchema,
  label: z.string().min(1).max(160),
  scopedToDecisionIds: z.array(fieldIdSchema).optional(),
});
export type ReasonOption = z.infer<typeof reasonOptionSchema>;
