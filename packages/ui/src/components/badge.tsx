import { cn } from "@bklit/ui/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-md border font-medium transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40 [a&]:hover:bg-destructive/90",
        success:
          "border-transparent bg-teal-900 text-teal-500 focus-visible:ring-teal-500/20 [a&]:hover:bg-teal-600",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        alternative:
          "border-transparent bg-purple-900 text-purple-300 focus-visible:ring-purple-500/20 [a&]:hover:bg-purple-600",
        code: "border-transparent bg-bklit-300 font-mono text-bklit-500 focus-visible:ring-muted-foreground/20 dark:bg-bklit-600 dark:text-bklit-100 [a&]:hover:bg-muted/90",
      },
      size: {
        default: "px-2 py-0.5 text-xs",
        lg: "px-2 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Badge({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      className={cn(badgeVariants({ variant, size }), className)}
      data-slot="badge"
      {...props}
    />
  );
}

export { Badge, badgeVariants };
