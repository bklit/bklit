import { Button } from "@bklit/ui/components/button";
import { LiveCardProvider } from "@bklit/ui/components/live/card";
import { LiveCardUserTrigger } from "@bklit/ui/components/live/card-trigger";
import { Skeleton } from "@bklit/ui/components/skeleton";
import { Suspense } from "react";
import { LiveCardWithData } from "@/components/live/live-card-with-data";

export default function TestPage() {
  // For testing, use your actual project IDs
  // You can get these from your live/page.tsx or replace with actual values
  const projectId = "test-project-id"; // Replace with actual project ID
  const organizationId = "test-org-id"; // Replace with actual organization ID

  return (
    <LiveCardProvider>
      <div className="relative flex flex-1 items-center justify-center bg-zinc-950">
        {/* Main content area */}
        <div className="text-center">
          <h1 className="mb-4 font-bold text-2xl text-white">
            Live Analytics Card Demo
          </h1>
          <p className="mb-6 text-zinc-400">
            The card is fixed to the bottom with LIVE data. Try clicking
            sections to see the morphing animations.
          </p>
          <LiveCardUserTrigger asChild>
            <Button variant="outline">
              Open User Detail (External Trigger)
            </Button>
          </LiveCardUserTrigger>
        </div>

        {/* Fixed card at bottom */}
        <div className="-translate-x-1/2 pointer-events-none absolute bottom-0 left-1/2 flex justify-center p-6">
          <div className="pointer-events-auto">
            <Suspense
              fallback={<Skeleton className="h-[300px] w-[420px] rounded-xl" />}
            >
              <LiveCardWithData
                organizationId={organizationId}
                projectId={projectId}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </LiveCardProvider>
  );
}
