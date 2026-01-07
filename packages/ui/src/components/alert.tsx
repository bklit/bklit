import { cn } from "@bklit/ui/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

const alertVariants = cva("", {
  variants: {
    variant: {
      default: "bg-bklit-600/30 text-foreground",
      success:
        "bg-linear-to-br from-teal-500/30 to-bklit-500 border-none p-px [&>div>svg]:text-emerald-500",
      destructive:
        "bg-linear-to-br from-rose-300/30 to-bklit-500 border-none p-px [&>div>svg]:text-rose-300",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

function Alert({
  className,
  variant,
  ...props
}: HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>) {
  return (
    <div className={cn(alertVariants({ variant }), "p-px rounded-lg")}>
      <div
        className={cn(
          "relative w-full bg-bklit-800 rounded-lg p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-5 [&>svg]:text-foreground",
          className,
        )}
        style={{
          mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);",
          maskComposite: "exclude",
        }}
        {...props}
      />
    </div>
  );
}

function AlertTitle({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <h5
      className={cn(
        "col-start-2 line-clamp-1 min-h-4 font-medium tracking-normal mb-1",
        className,
      )}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <div
      className={cn(
        "text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed",
        className,
      )}
      {...props}
    />
  );
}

function AlertFooter({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <div
      className={cn(
        "col-start-2 grid justify-items-start gap-1 mt-3",
        className,
      )}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription, AlertFooter };
