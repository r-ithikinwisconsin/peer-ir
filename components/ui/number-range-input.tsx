"use client";

import { cn } from "@/lib/cn";
import { Input } from "./input";

export interface NumberRangeInputProps {
  value: { min?: number; max?: number };
  onChange: (value: { min?: number; max?: number }) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  className?: string;
}

export function NumberRangeInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  className,
}: NumberRangeInputProps) {
  const parse = (v: string): number | undefined => {
    if (v === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Input
        type="number"
        inputMode="numeric"
        placeholder="Min"
        min={min}
        max={max}
        step={step}
        value={value.min ?? ""}
        onChange={(e) => onChange({ ...value, min: parse(e.target.value) })}
        className="flex-1"
      />
      <span className="text-text-subtle">to</span>
      <Input
        type="number"
        inputMode="numeric"
        placeholder="Max"
        min={min}
        max={max}
        step={step}
        value={value.max ?? ""}
        onChange={(e) => onChange({ ...value, max: parse(e.target.value) })}
        className="flex-1"
      />
      {unit && (
        <span className="label !mb-0 whitespace-nowrap">{unit}</span>
      )}
    </div>
  );
}
