"use client";

import { TooltipProvider } from "@bklit/ui/components/tooltip";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { BklitProvider } from "./bklit-provider";
import { GithubStatsProvider } from "./github-stats-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      disableTransitionOnChange
    >
      <BklitProvider>
        <TooltipProvider>
          <GithubStatsProvider>{children}</GithubStatsProvider>
        </TooltipProvider>
      </BklitProvider>
    </NextThemesProvider>
  );
}
