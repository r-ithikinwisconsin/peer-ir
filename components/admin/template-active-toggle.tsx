"use client";

import { useTransition } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { toggleTemplateActive } from "@/app/admin/cases/actions";

export function TemplateActiveToggle({
  id,
  initialActive,
}: {
  id: string;
  initialActive: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-2 text-sm">
      <Checkbox
        defaultChecked={initialActive}
        disabled={isPending}
        onCheckedChange={(checked) => {
          startTransition(async () => {
            await toggleTemplateActive(id, checked === true);
          });
        }}
      />
      <span className="text-text-muted">Active</span>
    </label>
  );
}
