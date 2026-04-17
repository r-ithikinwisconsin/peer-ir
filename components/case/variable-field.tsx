"use client";

import type { VariableField } from "@/lib/schemas/variable-field";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FieldValue = string | number | string[] | undefined;

interface VariableFieldRendererProps {
  field: VariableField;
  value: FieldValue;
  onChange: (value: FieldValue) => void;
  error?: string;
}

export function VariableFieldRenderer({
  field,
  value,
  onChange,
  error,
}: VariableFieldRendererProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-0.5">
        <Label>
          {field.label}
          {"required" in field && field.required && (
            <span className="text-text-subtle"> (required)</span>
          )}
        </Label>
        {field.help && (
          <p className="text-sm text-text-muted">{field.help}</p>
        )}
      </div>

      {field.type === "select" && (
        <div className="flex flex-wrap gap-2">
          {field.options.map((opt) => {
            const selected = value === opt.id;
            return (
              <Chip
                key={opt.id}
                selected={selected}
                onClick={() => onChange(selected ? undefined : opt.id)}
              >
                {opt.label}
              </Chip>
            );
          })}
        </div>
      )}

      {field.type === "multi_select" && (
        <div className="flex flex-wrap gap-2">
          {field.options.map((opt) => {
            const arr = Array.isArray(value) ? value : [];
            const selected = arr.includes(opt.id);
            return (
              <Chip
                key={opt.id}
                selected={selected}
                onClick={() => {
                  if (selected) onChange(arr.filter((id) => id !== opt.id));
                  else onChange([...arr, opt.id]);
                }}
              >
                {opt.label}
              </Chip>
            );
          })}
        </div>
      )}

      {field.type === "number_range" && (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="decimal"
            placeholder={
              field.min !== undefined && field.max !== undefined
                ? `${field.min}–${field.max}`
                : ""
            }
            min={field.min}
            max={field.max}
            step={field.step ?? 1}
            value={typeof value === "number" ? value : ""}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "") return onChange(undefined);
              const n = Number(v);
              onChange(Number.isFinite(n) ? n : undefined);
            }}
            className="flex-1"
          />
          {field.unit && (
            <span className="text-sm text-text-muted">{field.unit}</span>
          )}
        </div>
      )}

      {error && <p className="text-sm text-[#b91c1c]">{error}</p>}
    </div>
  );
}
