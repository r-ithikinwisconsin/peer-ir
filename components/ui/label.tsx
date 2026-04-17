"use client";

import * as RadixLabel from "@radix-ui/react-label";
import { forwardRef } from "react";
import { cn } from "@/lib/cn";

export const Label = forwardRef<
  React.ElementRef<typeof RadixLabel.Root>,
  React.ComponentPropsWithoutRef<typeof RadixLabel.Root>
>(function Label({ className, ...props }, ref) {
  return (
    <RadixLabel.Root
      ref={ref}
      className={cn("label mb-1.5 block", className)}
      {...props}
    />
  );
});
