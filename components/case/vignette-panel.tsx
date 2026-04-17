import type { VariableField } from "@/lib/schemas/variable-field";

interface Props {
  fields: VariableField[];
  values: Record<string, unknown>;
}

function labelFor(field: VariableField, raw: unknown): string {
  if (field.type === "select") {
    if (typeof raw !== "string") return "—";
    return field.options.find((o) => o.id === raw)?.label ?? raw;
  }
  if (field.type === "multi_select") {
    if (!Array.isArray(raw)) return "—";
    return raw
      .map((id) => field.options.find((o) => o.id === id)?.label ?? String(id))
      .join(", ");
  }
  if (field.type === "number_range") {
    if (typeof raw !== "number") return "—";
    return field.unit ? `${raw} ${field.unit}` : String(raw);
  }
  return "—";
}

export function VignettePanel({ fields, values }: Props) {
  return (
    <dl className="grid grid-cols-1 gap-0 overflow-hidden rounded-lg bg-surface shadow-card">
      {fields.map((f, idx) => {
        const raw = values[f.id];
        const has =
          raw !== undefined &&
          raw !== null &&
          raw !== "" &&
          !(Array.isArray(raw) && raw.length === 0);
        return (
          <div
            key={f.id}
            className={
              "flex items-baseline justify-between gap-4 px-4 py-3" +
              (idx > 0 ? " border-t border-border" : "")
            }
          >
            <dt className="text-sm text-text-muted">{f.label}</dt>
            <dd className="text-right text-[15px] font-semibold">
              {has ? labelFor(f, raw) : "—"}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
