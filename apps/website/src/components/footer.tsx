import { Button } from "@bklit/ui/components/button";
import { DiscordIcon } from "@bklit/ui/icons/discord";
import { GitHubIcon } from "@bklit/ui/icons/github";
import { XIcon } from "@bklit/ui/icons/x";
import { Github } from "lucide-react";
import Link from "next/link";
import { BrandTiles } from "./artworks/brand-tiles";
import { ButtonHealth } from "./button-health";
import { GithubStarCount } from "./github-star-count";

export const Footer = () => {
  return (
    <footer className="mt-auto bg-background">
      <div className="container mx-auto flex max-w-6xl flex-col gap-4 px-4">
        <BrandTiles />
        <div className="grid grid-cols-1 gap-8 border-t pt-16 md:grid-cols-2">
          <div className="col-span-1 space-y-4">
            <h4 className="font-bold text-base">Company</h4>
            <ul className="flex flex-col gap-2 text-muted-foreground text-sm">
              <li>
                <Link
                  className="group relative flex items-center gap-2 transition-all duration-200 hover:text-foreground"
                  href="/terms"
                >
                  <span className="absolute left-0 text-lime-200 opacity-0 transition group-hover:opacity-100">
                    ◑
                  </span>
                  <span className="transition-all duration-200 group-hover:translate-x-[20px]">
                    Terms of use
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  className="group relative flex items-center gap-2 transition-all duration-200 hover:text-foreground"
                  href="/privacy"
                >
                  <span className="absolute left-0 text-lime-200 opacity-0 transition group-hover:opacity-100">
                    ◑
                  </span>
                  <span className="transition-all duration-200 group-hover:translate-x-[20px]">
                    Privacy policy
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  className="group relative flex items-center gap-2 transition-all duration-200 hover:text-foreground"
                  href="/pricing"
                >
                  <span className="absolute left-0 text-lime-200 opacity-0 transition delay-100 duration-100 group-hover:opacity-100">
                    ◑
                  </span>
                  <span className="transition-all duration-200 group-hover:translate-x-[20px]">
                    Pricing
                  </span>
                </Link>
              </li>
              <li>
                <a
                  className="group relative flex items-center gap-2 transition-all duration-200 hover:text-foreground"
                  href="mailto:support@bklit.com?subject=Support%20Request"
                >
                  <span className="absolute left-0 text-lime-200 opacity-0 transition group-hover:opacity-100">
                    ◑
                  </span>
                  <span className="transition-all duration-200 group-hover:translate-x-[20px]">
                    Contact
                  </span>
                </a>
              </li>
              <li>
                <a
                  className="group relative flex items-center gap-2 transition-all duration-200 hover:text-foreground"
                  href="https://docs.bklit.com"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <span className="absolute left-0 text-lime-200 opacity-0 transition group-hover:opacity-100">
                    ◑
                  </span>
                  <span className="transition-all duration-200 group-hover:translate-x-[20px]">
                    Docs
                  </span>
                </a>
              </li>
              <li>
                <Link
                  className="group relative flex items-center gap-2 transition-all duration-200 hover:text-foreground"
                  href="/branding"
                >
                  <span className="absolute left-0 text-lime-200 opacity-0 transition group-hover:opacity-100">
                    ◑
                  </span>
                  <span className="transition-all duration-200 group-hover:translate-x-[20px]">
                    Branding
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  className="group relative flex items-center gap-2 transition-all duration-200 hover:text-foreground"
                  href="/updates"
                >
                  <span className="absolute left-0 text-lime-200 opacity-0 transition group-hover:opacity-100">
                    ◑
                  </span>
                  <span className="transition-all duration-200 group-hover:translate-x-[20px]">
                    Updates
                  </span>
                </Link>
              </li>
            </ul>
          </div>
          <div className="col-span-1 space-y-4">
            <h4 className="font-bold text-base">Bklit Inc.</h4>
            <p className="font-normal text-muted-foreground text-xs md:text-sm">
              169 Madison Avenue, New York, NY 10016 US
            </p>
            <ul className="flex items-center gap-4">
              <li>
                <a
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  href="https://github.com/bklit/bklit"
                  rel="noopener noreferrer"
                  target="_blank"
                  title="Github"
                >
                  <GitHubIcon className="size-5" />
                </a>
              </li>
              <li>
                <a
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  href="https://x.com/bklitai"
                  rel="noopener noreferrer"
                  target="_blank"
                  title="X"
                >
                  <XIcon className="size-5" />
                </a>
              </li>
              <li>
                <a
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  href="https://discord.gg/9yyK8FwPcU"
                  rel="noopener noreferrer"
                  target="_blank"
                  title="Discord"
                >
                  <DiscordIcon className="size-5" />
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col justify-between gap-4 py-8 pt-0 md:flex-row md:items-center md:pt-8">
          <p className="order-2 text-muted-foreground text-xs sm:order-1 sm:text-sm">
            &copy; {new Date().getFullYear()} Bklit Inc. All rights reserved.
          </p>
          <div className="order-1 flex flex-col items-start gap-2 sm:order-2 sm:flex-row sm:items-center">
            <Button asChild size="lg" variant="outline">
              <a
                href="https://github.com/bklit/bklit"
                rel="noopener noreferrer"
                target="_blank"
                title="Bklit on Github"
              >
                <Github size={16} /> See on Github
                <span className="flex items-center gap-1 opacity-70 transition-opacity group-hover:opacity-100">
                  <GithubStarCount />
                </span>
              </a>
            </Button>
            <ButtonHealth />
          </div>
        </div>
      </div>
    </footer>
  );
};
