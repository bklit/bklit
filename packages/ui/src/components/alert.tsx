import { cn } from "@bklit/ui/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

const alertVariants = cva("", {
  variants: {
    variant: {
      default: "bg-bklit-600/30 text-foreground",
      success:
        "border-none bg-linear-to-br from-teal-500/30 to-bklit-500 p-px [&>div>svg]:text-emerald-500",
      destructive:
        "border-none bg-linear-to-br from-rose-300/30 to-bklit-500 p-px [&>div>svg]:text-rose-300",
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
    <div className={cn(alertVariants({ variant }), "rounded-lg p-px")}>
      <div
        className={cn(
          "relative w-full rounded-lg bg-bklit-800 p-4 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:top-5 [&>svg]:left-4 [&>svg]:text-foreground [&>svg~*]:pl-7",
          className
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
        "col-start-2 mb-1 line-clamp-1 min-h-4 font-medium tracking-normal",
        className
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
        "col-start-2 grid justify-items-start gap-1 text-muted-foreground text-sm [&_p]:leading-relaxed",
        className
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
        "col-start-2 mt-3 grid justify-items-start gap-1",
        className
      )}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription, AlertFooter };
