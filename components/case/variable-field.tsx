"use client";

import type { VariableField } from "@/lib/schemas/variable-field";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
        <Select
          value={typeof value === "string" ? value : ""}
          onValueChange={(v) => onChange(v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose one" />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((opt) => (
              <SelectItem key={opt.id} value={opt.id}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {field.type === "multi_select" && (
        <div className="flex flex-col gap-1 rounded-lg bg-surface p-1 shadow-card">
          {field.options.map((opt) => {
            const arr = Array.isArray(value) ? value : [];
            const checked = arr.includes(opt.id);
            return (
              <label
                key={opt.id}
                className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 hover:bg-chip-bg"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(next) => {
                    if (next) onChange([...arr, opt.id]);
                    else onChange(arr.filter((id) => id !== opt.id));
                  }}
                />
                <span className="text-[15px]">{opt.label}</span>
              </label>
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
