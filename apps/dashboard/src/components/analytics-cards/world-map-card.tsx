"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import { Skeleton } from "@bklit/ui/components/skeleton";
import { useEffect, useState } from "react";
import { authClient } from "@/auth/client";
import { useWorkspace } from "@/contexts/workspace-provider";
import { WorldMap } from "../maps/world-map";

export function WorldMapCard() {
  const [isMounted, setIsMounted] = useState(false);
  const { activeProject } = useWorkspace();
  const { data: session } = authClient.useSession();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <WorldMapCardSkeleton />;
  }

  if (!activeProject?.id || !session?.user?.id) {
    return <WorldMapCardSkeleton />;
  }

  return (
    <Card className="p-0 relative">
      <CardHeader className="absolute top-0 w-full bg-card-background backdrop-blur-xl z-10 pt-6 pb-4 rounded-t-xl overflow-clip">
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
