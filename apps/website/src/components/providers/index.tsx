"use client";

import { TooltipProvider } from "@bklit/ui/components/tooltip";
import { BklitProvider } from "./bklit-provider";
import { GithubStatsProvider } from "./github-stats-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <BklitProvider>
      <TooltipProvider>
        <GithubStatsProvider>{children}</GithubStatsProvider>
      </TooltipProvider>
    </BklitProvider>
  );
}
