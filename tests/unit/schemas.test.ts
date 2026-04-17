import { describe, expect, it } from "vitest";
import {
  variableFieldSchema,
  decisionOptionSchema,
  reasonOptionSchema,
  type VariableField,
} from "@/lib/schemas/variable-field";
import {
  caseVariablesSchema,
  buildCaseVariablesSchema,
} from "@/lib/schemas/case";

describe("variableFieldSchema", () => {
  it("accepts a valid select field", () => {
    const res = variableFieldSchema.safeParse({
      type: "select",
      id: "child_pugh",
      label: "Liver function",
      required: true,
      options: [
        { id: "a", label: "A" },
        { id: "b", label: "B" },
      ],
    });
    expect(res.success).toBe(true);
  });

  it("rejects a select field with fewer than 2 options", () => {
    const res = variableFieldSchema.safeParse({
      type: "select",
      id: "x",
      label: "X",
      options: [{ id: "a", label: "A" }],
    });
    expect(res.success).toBe(false);
  });

  it("rejects a number_range with non-positive step", () => {
    const res = variableFieldSchema.safeParse({
      type: "number_range",
      id: "size",
      label: "Size",
      step: 0,
    });
    expect(res.success).toBe(false);
  });

  it("rejects an id with uppercase letters", () => {
    const res = variableFieldSchema.safeParse({
      type: "select",
      id: "Bad_Id",
      label: "x",
      options: [
        { id: "a", label: "A" },
        { id: "b", label: "B" },
      ],
    });
    expect(res.success).toBe(false);
  });
});

describe("decisionOptionSchema", () => {
  it("accepts a minimal option", () => {
    const res = decisionOptionSchema.safeParse({ id: "tace", label: "TACE" });
    expect(res.success).toBe(true);
  });

  it("rejects an empty label", () => {
    const res = decisionOptionSchema.safeParse({ id: "tace", label: "" });
    expect(res.success).toBe(false);
  });
});

describe("reasonOptionSchema", () => {
  it("accepts scopedToDecisionIds", () => {
    const res = reasonOptionSchema.safeParse({
      id: "bridge",
      label: "Bridging to transplant",
      scopedToDecisionIds: ["tace", "y90"],
    });
    expect(res.success).toBe(true);
  });

  it("rejects invalid decision id in scope", () => {
    const res = reasonOptionSchema.safeParse({
      id: "bridge",
      label: "Bridging",
      scopedToDecisionIds: ["NOT VALID"],
    });
    expect(res.success).toBe(false);
  });
});

describe("caseVariablesSchema", () => {
  it("accepts a flat map of scalar / array values", () => {
    const res = caseVariablesSchema.safeParse({
      child_pugh: "a",
      tumor_size_cm: 4,
      complications: ["bleed"],
    });
    expect(res.success).toBe(true);
  });

  it("rejects an object with too many keys", () => {
    const obj: Record<string, number> = {};
    for (let i = 0; i < 40; i++) obj[`k${i}`] = i;
    const res = caseVariablesSchema.safeParse(obj);
    expect(res.success).toBe(false);
  });
});

describe("buildCaseVariablesSchema", () => {
  const fields: VariableField[] = [
    {
      type: "select",
      id: "child_pugh",
      label: "Liver function",
      required: true,
      options: [
        { id: "a", label: "A" },
        { id: "b", label: "B" },
      ],
    },
    {
      type: "multi_select",
      id: "complications",
      label: "Complications",
      required: false,
      minSelected: 0,
      options: [
        { id: "bleed", label: "Bleed" },
        { id: "abscess", label: "Abscess" },
      ],
    },
    {
      type: "number_range",
      id: "tumor_size_cm",
      label: "Tumor size",
      required: true,
      min: 1,
      max: 10,
    },
  ];

  it("accepts a fully valid payload", () => {
    const schema = buildCaseVariablesSchema(fields);
    const res = schema.safeParse({
      child_pugh: "a",
      tumor_size_cm: 4,
      complications: ["bleed"],
    });
    expect(res.success).toBe(true);
  });

  it("select rejects an unknown option id", () => {
    const schema = buildCaseVariablesSchema(fields);
    const res = schema.safeParse({
      child_pugh: "z",
      tumor_size_cm: 4,
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues.some((i) => i.path[0] === "child_pugh")).toBe(true);
    }
  });

  it("multi_select rejects a non-array value", () => {
    const schema = buildCaseVariablesSchema(fields);
    const res = schema.safeParse({
      child_pugh: "a",
      tumor_size_cm: 4,
      complications: "bleed",
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(
        res.error.issues.some((i) => i.path[0] === "complications"),
      ).toBe(true);
    }
  });

  it("number_range enforces min/max", () => {
    const schema = buildCaseVariablesSchema(fields);
    const tooSmall = schema.safeParse({
      child_pugh: "a",
      tumor_size_cm: 0.5,
    });
    expect(tooSmall.success).toBe(false);

    const tooBig = schema.safeParse({
      child_pugh: "a",
      tumor_size_cm: 20,
    });
    expect(tooBig.success).toBe(false);
  });

  it("required field missing fails", () => {
    const schema = buildCaseVariablesSchema(fields);
    const res = schema.safeParse({
      tumor_size_cm: 4,
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues.some((i) => i.path[0] === "child_pugh")).toBe(true);
    }
  });

  it("extra unknown field id fails", () => {
    const schema = buildCaseVariablesSchema(fields);
    const res = schema.safeParse({
      child_pugh: "a",
      tumor_size_cm: 4,
      free_text: "not allowed",
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues.some((i) => i.path[0] === "free_text")).toBe(true);
    }
  });

  it("multi_select with minSelected enforces the minimum", () => {
    const strict: VariableField[] = [
      {
        type: "multi_select",
        id: "complications",
        label: "Complications",
        required: false,
        minSelected: 2,
        options: [
          { id: "bleed", label: "Bleed" },
          { id: "abscess", label: "Abscess" },
          { id: "infection", label: "Infection" },
        ],
      },
    ];
    const schema = buildCaseVariablesSchema(strict);
    const tooFew = schema.safeParse({ complications: ["bleed"] });
    expect(tooFew.success).toBe(false);

    const ok = schema.safeParse({ complications: ["bleed", "abscess"] });
    expect(ok.success).toBe(true);
  });
});
