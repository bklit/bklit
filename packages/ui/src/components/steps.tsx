import { cn } from "@bklit/ui/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

interface StepsProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

interface StepProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Steps({ children, className, ...props }: StepsProps) {
  return (
    <div
      className={cn("mb-6 ml-4 border-border border-l pl-6 [counter-reset:step]", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function Step({ children, className, ...props }: StepProps) {
  return (
    <div
      className={cn(
        "relative mb-8 pl-10 [counter-increment:step] last:mb-0",
        className
      )}
      {...props}
    >
      <div className="bg-background absolute top-1 -left-10 flex size-8 items-center justify-center rounded-full border-2 border-primary text-primary font-semibold text-sm before:content-[counter(step)]" />
      <div className="page-content [&>h3:first-child]:mt-0 [&>h3]:mb-2 [&>h3]:text-lg [&>h3]:font-semibold">
        {children}
      </div>
    </div>
  );
}

