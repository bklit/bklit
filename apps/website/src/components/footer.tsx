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
    <footer className="bg-background mt-auto">
      <div className="container mx-auto max-w-6xl flex flex-col px-4 gap-4">
        <BrandTiles />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t pt-16">
          <div className="col-span-1 space-y-4">
            <h4 className="text-base font-bold">Company</h4>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/terms"
                  className="flex items-center gap-2 group transition-all duration-200 relative hover:text-foreground"
                >
                  <span className="text-lime-200 transition absolute left-0 opacity-0 group-hover:opacity-100">
                    ◑
                  </span>
                  <span className="transition-all duration-200 group-hover:translate-x-[20px]">
                    Terms of use
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="flex items-center gap-2 group transition-all duration-200 relative hover:text-foreground"
                >
                  <span className="text-lime-200 transition absolute left-0 opacity-0 group-hover:opacity-100">
                    ◑
                  </span>
                  <span className="transition-all duration-200 group-hover:translate-x-[20px]">
                    Privacy policy
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="flex items-center gap-2 group transition-all duration-200 relative hover:text-foreground"
                >
                  <span className="text-lime-200 transition duration-100 absolute left-0 opacity-0 group-hover:opacity-100 delay-100">
                    ◑
                  </span>
                  <span className="transition-all duration-200 group-hover:translate-x-[20px]">
                    Pricing
                  </span>
                </Link>
              </li>
              <li>
                <a
                  href="mailto:support@bklit.com?subject=Support%20Request"
                  className="flex items-center gap-2 group transition-all duration-200 relative hover:text-foreground"
                >
                  <span className="text-lime-200 transition absolute left-0 opacity-0 group-hover:opacity-100">
                    ◑
                  </span>
                  <span className="transition-all duration-200 group-hover:translate-x-[20px]">
                    Contact
                  </span>
                </a>
              </li>
              <li>
                <a
                  href="https://docs.bklit.com"
                  className="flex items-center gap-2 group transition-all duration-200 relative hover:text-foreground"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="text-lime-200 transition absolute left-0 opacity-0 group-hover:opacity-100">
                    ◑
                  </span>
                  <span className="transition-all duration-200 group-hover:translate-x-[20px]">
                    Docs
                  </span>
                </a>
              </li>
              <li>
                <Link
                  href="/"
                  className="flex items-center gap-2 group transition-all duration-200 relative hover:text-foreground opacity-50"
                >
                  <span className="text-lime-200 transition absolute left-0 opacity-0 group-hover:opacity-100">
                    ◑
                  </span>
                  <span className="transition-all duration-200 group-hover:translate-x-[20px]">
                    Branding
                  </span>
                </Link>
              </li>
            </ul>
          </div>
          <div className="col-span-1 space-y-4">
            <h4 className="text-base font-bold">Bklit Inc.</h4>
            <p className="text-xs md:text-sm text-muted-foreground font-normal">
              169 Madison Avenue, New York, NY 10016 US
            </p>
            <ul className="flex items-center gap-4">
              <li>
                <a
                  href="https://github.com/bklit/bklit"
                  title="Github"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <GitHubIcon className="size-5" />
                </a>
              </li>
              <li>
                <a
                  href="https://x.com/bklitai"
                  title="X"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <XIcon className="size-5" />
                </a>
              </li>
              <li>
                <a
                  href="https://discord.gg/bklit"
                  title="Discord"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <DiscordIcon className="size-5" />
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between py-8 pt-0 md:pt-8 gap-4">
          <p className="text-muted-foreground text-xs sm:text-sm order-2 sm:order-1">
            &copy; {new Date().getFullYear()} Bklit Inc. All rights reserved.
          </p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 order-1 sm:order-2">
            <Button variant="outline" size="lg" asChild>
              <a
                href="https://github.com/bklit/bklit"
                target="_blank"
                title="Bklit on Github"
                rel="noopener noreferrer"
              >
                <Github size={16} /> See on Github
                <span className="flex items-center gap-1 group-hover:opacity-100 opacity-70 transition-opacity">
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
