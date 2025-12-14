import { BklitLogo } from "@bklit/ui/icons/bklit";
import { DiscordIcon } from "@bklit/ui/icons/discord";
import { GitHubIcon } from "@bklit/ui/icons/github";
import { ExternalLink } from "fumadocs-ui/internal/icons";
import { DocsLayout } from "fumadocs-ui/layouts/notebook";
import { source } from "@/lib/source";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <DocsLayout
      tree={source.pageTree}
      tabMode="navbar"
      githubUrl="https://github.com/bklit/bklit"
      nav={{
        mode: "top",
        title: (
          <div className="flex items-center gap-2">
            <BklitLogo size={32} className="dark:text-white text-black" />
            <span className="text-lg font-semibold">Bklit</span>
          </div>
        ),
      }}
      sidebar={{
        banner: (
          <div className="flex flex-col gap-1 mt-4">
            <a
              href="https://github.com/bklit/bklit"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-2 group"
            >
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center size-8 border border-border rounded-md bg-muted transition-all duration-200 group-hover:bg-muted/50 group-hover:border-bklit-400">
                  <GitHubIcon className="size-4 dark:text-white text-black" />
                </div>
                <span className="text-sm font-semibold group-hover:text-white transition-all duration-200">
                  GitHub
                </span>
              </div>
              <ExternalLink className="size-4 dark:text-white text-black opacity-0 group-hover:opacity-100 transition-all duration-200" />
            </a>
            <a
              href="https://discord.gg/GFfD67gZGf"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-2 group"
            >
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center size-8 border border-border rounded-md bg-muted transition-all duration-200 group-hover:bg-muted/50 group-hover:border-bklit-400">
                  <DiscordIcon className="size-4 dark:text-white text-black" />
                </div>
                <span className="text-sm font-semibold group-hover:text-white transition-all duration-200">
                  Discord
                </span>
              </div>
              <ExternalLink className="size-4 dark:text-white text-black opacity-0 group-hover:opacity-100 transition-all duration-200" />
            </a>
          </div>
        ),
      }}
    >
      {children}
    </DocsLayout>
  );
}
