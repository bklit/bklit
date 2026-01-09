import { cn } from "@bklit/ui/lib/utils";

interface SectionHeaderProps {
  title: string;
  description: string;
  children?: React.ReactNode;
  align?: "left" | "center" | "right";
}
export const SectionHeader = ({
  title,
  description,
  children,
  align = "center",
}: SectionHeaderProps) => {
  return (
    <div
      className={cn(
        "container mx-auto flex max-w-6xl flex-col space-y-4 px-4",
        align === "left" && "text-left",
        align === "center" && "text-center",
        align === "right" && "text-right"
      )}
    >
      <h2
        className={cn(
          "font-regular text-3xl sm:text-3xl",
          align === "left" && "text-left",
          align === "center" && "text-center",
          align === "right" && "text-right"
        )}
      >
        {title}
      </h2>
      <p
        className={cn(
          "font-light text-lg text-muted-foreground sm:text-2xl",
          align === "left" && "text-left",
          align === "center" && "text-center",
          align === "right" && "text-right"
        )}
      >
        {description}
      </p>
      {children && (
        <div
          className={cn(
            "flex flex-col gap-4",
            align === "left" && "items-start",
            align === "center" && "items-center",
            align === "right" && "items-end"
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
};
