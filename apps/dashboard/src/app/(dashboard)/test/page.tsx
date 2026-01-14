import { Button } from "@bklit/ui/components/button";
import { LiveCard, LiveCardProvider } from "@bklit/ui/components/live/card";
import { LiveCardUserTrigger } from "@bklit/ui/components/live/card-trigger";

export default function TestPage() {
  return (
    <div className="relative flex flex-1 items-center justify-center bg-zinc-950">
      <LiveCardProvider>
        {/* Main content area */}
        <div className="text-center">
          <h1 className="mb-4 font-bold text-2xl text-white">
            Live Analytics Card Demo
          </h1>
          <p className="mb-6 text-zinc-400">
            The card is fixed to the bottom. Try clicking sections to see the
            morphing animations.
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
            <LiveCard />
          </div>
        </div>
      </LiveCardProvider>
    </div>
  );
}
