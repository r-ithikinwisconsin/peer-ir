import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";
import { CategoryPill } from "@/components/ui/category-pill";
import { cn } from "@/lib/cn";
import { GENDER_SHORT, type PatientGender } from "@/lib/schemas/enums";

export interface CaseCardProps {
  caseNumber: number;
  age: number;
  gender: PatientGender;
  category: string;
  teaser?: string;
  isOwn?: boolean;
  hasVoted?: boolean;
  className?: string;
}

export function CaseCard({
  caseNumber,
  age,
  gender,
  category,
  teaser,
  isOwn,
  hasVoted,
  className,
}: CaseCardProps) {
  return (
    <Link
      href={`/cases/${caseNumber}`}
      className={cn(
        "group flex items-center gap-4 rounded-lg bg-surface p-4 shadow-card transition-shadow hover:shadow-card-hover",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-center gap-2">
          <CategoryPill>{category}</CategoryPill>
          {isOwn ? (
            <span className="inline-flex h-5 items-center rounded-full bg-primary-soft px-2 text-[10px] font-bold uppercase tracking-wider text-primary-soft-fg">
              Your case
            </span>
          ) : hasVoted ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-success">
              <Check size={12} strokeWidth={3} />
              Voted
            </span>
          ) : null}
        </div>
        <h3 className="text-[16px] font-semibold leading-tight">
          Case #{caseNumber}
          <span className="ml-2 font-semibold text-text-muted">
            {age}
            {GENDER_SHORT[gender]}
          </span>
        </h3>
        {teaser && (
          <p className="truncate text-sm text-text-muted">{teaser}</p>
        )}
      </div>
      <ChevronRight
        size={20}
        className="text-text-subtle transition-transform group-hover:translate-x-0.5"
      />
    </Link>
  );
}
