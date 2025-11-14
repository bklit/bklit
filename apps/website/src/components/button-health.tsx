import { prisma } from "@bklit/db/client";
import { Badge } from "@bklit/ui/components/badge";
import { cn } from "@bklit/ui/lib/utils";

export const ButtonHealth = async () => {
  let isHealthy = false;

  try {
    const recentChecks = await prisma.apiHealthCheck.findMany({
      orderBy: {
        timestamp: "desc",
      },
      take: 10,
      distinct: ["endpoint"],
    });

    isHealthy =
      recentChecks.length > 0 && recentChecks.every((check) => check.isHealthy);
  } catch (error) {
    console.error("Failed to fetch health status:", error);
  }

  return (
    <Badge
      variant="outline"
      className={cn("gap-2 cursor-pointer hover:bg-accent transition-colors")}
      size="lg"
    >
      <span
        className={cn(
          "inline-flex size-2 rounded-full",
          isHealthy ? "bg-teal-700" : "bg-destructive",
        )}
      />
      {isHealthy ? "Systems normal" : "Issues detected"}
    </Badge>
  );
};
