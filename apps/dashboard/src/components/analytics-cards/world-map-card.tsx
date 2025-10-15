"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import { Skeleton } from "@bklit/ui/components/skeleton";
import { authClient } from "@/auth/client";
import { useWorkspace } from "@/contexts/workspace-provider";
import { WorldMap } from "../maps/world-map";

export function WorldMapCard() {
  const { activeProject } = useWorkspace();
  const { data: session } = authClient.useSession();

  if (!activeProject?.id || !session?.user?.id) {
    return <WorldMapCardSkeleton />;
  }

  return (
    <Card className="p-0 relative">
      <CardHeader className="absolute top-0 w-full backdrop-blur-md z-10 pt-6 pb-4">
        <CardTitle>World Map</CardTitle>
        <CardDescription>
          A map of the world with the number of page views per country.
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[480px] w-full p-0">
        <WorldMap projectId={activeProject.id} userId={session.user.id} />
      </CardContent>
    </Card>
  );
}

export function WorldMapCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>World Map</CardTitle>
        <CardDescription>
          A map of the world with the number of page views per country.
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[400px] w-full">
        <Skeleton className="h-[400px] w-full" />
      </CardContent>
    </Card>
  );
}
