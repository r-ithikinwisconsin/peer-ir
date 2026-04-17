import { z } from "zod";
import { patientGenderSchema } from "./enums";
import { type VariableField } from "./variable-field";

export const caseVariableValueSchema = z.union([
  z.string().max(64),
  z.number().finite(),
  z.array(z.string().max(64)).max(20),
]);

export const caseVariablesSchema = z
  .record(z.string().regex(/^[a-z0-9_-]+$/), caseVariableValueSchema)
  .refine(
    (obj) => Object.keys(obj).length <= 32,
    "Too many variables submitted",
  );
export type CaseVariables = z.infer<typeof caseVariablesSchema>;

export function buildCaseVariablesSchema(fields: VariableField[]) {
  const knownIds = new Set(fields.map((f) => f.id));
  return caseVariablesSchema.superRefine((obj, ctx) => {
    for (const key of Object.keys(obj)) {
      if (!knownIds.has(key)) {
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: `Unknown field: ${key}`,
        });
      }
    }
    for (const f of fields) {
      const value = obj[f.id];
      const present =
        value !== undefined &&
        value !== null &&
        value !== "" &&
        !(Array.isArray(value) && value.length === 0);

      if (!present) {
        if ("required" in f && f.required) {
          ctx.addIssue({ code: "custom", path: [f.id], message: "Required" });
        }
        continue;
      }

      if (f.type === "select") {
        if (typeof value !== "string" || !f.options.some((o) => o.id === value)) {
          ctx.addIssue({ code: "custom", path: [f.id], message: "Invalid choice" });
        }
      } else if (f.type === "multi_select") {
        if (!Array.isArray(value)) {
          ctx.addIssue({ code: "custom", path: [f.id], message: "Must be an array" });
        } else {
          const opts = new Set(f.options.map((o) => o.id));
          for (const v of value) {
            if (typeof v !== "string" || !opts.has(v)) {
              ctx.addIssue({
                code: "custom",
                path: [f.id],
                message: `Invalid choice: ${String(v)}`,
              });
            }
          }
          if (value.length < (f.minSelected ?? 0)) {
            ctx.addIssue({
              code: "custom",
              path: [f.id],
              message: `Select at least ${f.minSelected}`,
            });
          }
        }
      } else if (f.type === "number_range") {
        if (typeof value !== "number" || !Number.isFinite(value)) {
          ctx.addIssue({ code: "custom", path: [f.id], message: "Must be a number" });
        } else {
          if (f.min !== undefined && value < f.min) {
            ctx.addIssue({
              code: "custom",
              path: [f.id],
              message: `Must be ≥ ${f.min}`,
            });
          }
          if (f.max !== undefined && value > f.max) {
            ctx.addIssue({
              code: "custom",
              path: [f.id],
              message: `Must be ≤ ${f.max}`,
            });
          }
        }
      }
    }
  });
}

export const caseSubmitSchema = z.object({
  age: z.number().int().min(0).max(120),
  gender: patientGenderSchema,
  caseVariables: caseVariablesSchema,
  decisionId: z.string().regex(/^[a-z0-9_-]+$/).min(1).max(64),
  otherText: z.string().trim().max(240).optional(),
  reasonIds: z.array(z.string().regex(/^[a-z0-9_-]+$/)).max(20).default([]),
});
export type CaseSubmit = z.infer<typeof caseSubmitSchema>;
