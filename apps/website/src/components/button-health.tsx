import { prisma } from "@bklit/db/client";
import { Button } from "@bklit/ui/components/button";
import { cn } from "@bklit/ui/lib/utils";
import Link from "next/link";

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
    <Button
      asChild
      className={cn("cursor-pointer gap-2 transition-colors hover:bg-accent")}
      size="lg"
      variant="outline"
    >
      <Link
        aria-label="View system status"
        href="/status"
        title="View system status"
      >
        <span
          className={cn(
            "inline-flex size-2 rounded-full",
            isHealthy ? "bg-teal-700" : "bg-destructive"
          )}
        />
        {isHealthy ? "Systems normal" : "Issues detected"}
      </Link>
    </Button>
  );
};
