"use client";

import { TooltipProvider } from "@bklit/ui/components/tooltip";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { GithubStatsProvider } from "./github-stats-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <TooltipProvider>
        <GithubStatsProvider>{children}</GithubStatsProvider>
      </TooltipProvider>
    </NextThemesProvider>
  );
}
