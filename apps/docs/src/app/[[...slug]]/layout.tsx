import { BklitLogo } from "@bklit/ui/icons/bklit";
import { DiscordIcon } from "@bklit/ui/icons/discord";
import { GitHubIcon } from "@bklit/ui/icons/github";
import { ExternalLink } from "fumadocs-ui/internal/icons";
import { DocsLayout } from "fumadocs-ui/layouts/notebook";
import { source } from "@/lib/source";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <DocsLayout
      githubUrl="https://github.com/bklit/bklit"
      nav={{
        mode: "top",
        title: (
          <div className="flex items-center gap-2">
            <BklitLogo className="text-black dark:text-white" size={32} />
            <span className="font-semibold text-lg">Bklit</span>
          </div>
        ),
      }}
      sidebar={{
        banner: (
          <div className="mt-4 flex flex-col gap-1">
            <a
              className="group flex items-center justify-between gap-2"
              href="https://github.com/bklit/bklit"
              rel="noopener noreferrer"
              target="_blank"
            >
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-md border border-border bg-muted transition-all duration-200 group-hover:border-bklit-400 group-hover:bg-muted/50">
                  <GitHubIcon className="size-4 text-black dark:text-white" />
                </div>
                <span className="font-semibold text-sm transition-all duration-200 group-hover:text-white">
                  GitHub
                </span>
              </div>
              <ExternalLink className="size-4 text-black opacity-0 transition-all duration-200 group-hover:opacity-100 dark:text-white" />
            </a>
            <a
              className="group flex items-center justify-between gap-2"
              href="https://discord.gg/GFfD67gZGf"
              rel="noopener noreferrer"
              target="_blank"
            >
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-md border border-border bg-muted transition-all duration-200 group-hover:border-bklit-400 group-hover:bg-muted/50">
                  <DiscordIcon className="size-4 text-black dark:text-white" />
                </div>
                <span className="font-semibold text-sm transition-all duration-200 group-hover:text-white">
                  Discord
                </span>
              </div>
              <ExternalLink className="size-4 text-black opacity-0 transition-all duration-200 group-hover:opacity-100 dark:text-white" />
            </a>
          </div>
        ),
      }}
      tabMode="navbar"
      tree={source.pageTree}
    >
      {children}
    </DocsLayout>
  );
}
