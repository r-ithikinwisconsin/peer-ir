import type { VariableField } from "@/lib/schemas/variable-field";

/**
 * Produces a short human-readable teaser from the actual case variable values.
 * Shows the first 2–3 select / multi-select fields so peers can tell cases apart
 * at a glance on the feed card.
 */
export function renderCaseVariablesTeaser(
  fields: VariableField[],
  values: Record<string, unknown>,
): string {
  const parts: string[] = [];
  for (const f of fields) {
    if (parts.length >= 3) break;
    const raw = values[f.id];
    if (f.type === "select") {
      if (typeof raw !== "string") continue;
      const opt = f.options.find((o) => o.id === raw);
      if (opt) parts.push(opt.label);
    } else if (f.type === "multi_select") {
      if (!Array.isArray(raw) || raw.length === 0) continue;
      const first = raw[0];
      if (typeof first !== "string") continue;
      const opt = f.options.find((o) => o.id === first);
      if (!opt) continue;
      parts.push(
        raw.length === 1 ? opt.label : `${opt.label} +${raw.length - 1}`,
      );
    }
  }
  return parts.join(" · ");
}
