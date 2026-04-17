import { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-semibold transition-colors transition-opacity select-none disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-fg hover:bg-primary/90 active:bg-primary/95",
        secondary:
          "bg-surface text-primary border border-border hover:border-primary/40 active:bg-primary-soft/40",
        soft: "bg-primary-soft text-primary-soft-fg hover:bg-primary-soft/80",
        ghost: "text-primary hover:bg-primary-soft/60",
        danger:
          "bg-surface text-[#b91c1c] border border-[#fecaca] hover:bg-[#fef2f2]",
      },
      size: {
        md: "h-11 px-5 text-[15px] rounded-md",
        lg: "h-12 px-6 text-base rounded-md",
        sm: "h-9 px-4 text-sm rounded-sm",
        icon: "h-11 w-11 rounded-md",
      },
      block: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className, variant, size, block, asChild = false, ...props },
    ref,
  ) {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, block }), className)}
        {...props}
      />
    );
  },
);
