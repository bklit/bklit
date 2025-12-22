import { DiscordIcon } from "@bklit/ui/icons/discord";
import { GitHubIcon } from "@bklit/ui/icons/github";
import { XIcon } from "@bklit/ui/icons/x";
import Link from "next/link";
import { ButtonHealth } from "./button-health";
import { ThemeSwitcher } from "./theme-switcher";

export const Footer = () => {
  return (
    <div>
      <div className="block h-48 bg-linear-to-b from-transparent to-background" />
      <footer className="mt-auto bg-background">
        <div className="container mx-auto flex max-w-6xl flex-col gap-24 px-4">
          <div className="grid grid-cols-1 gap-8 border-zinc-200 border-t pt-8 md:grid-cols-2 dark:border-zinc-900">
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
                    className="group relative flex items-center gap-2 opacity-50 transition-all duration-200 hover:text-foreground"
                    href="/"
                  >
                    <span className="absolute left-0 text-lime-200 opacity-0 transition group-hover:opacity-100">
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
                    href="https://discord.gg/bklit"
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
          <div className="flex flex-col justify-between gap-2 py-8 pt-0 md:flex-row md:items-center md:gap-0 md:pt-8">
            <p className="text-muted-foreground text-sm">
              &copy; {new Date().getFullYear()} Bklit Inc. All rights reserved.
            </p>
            <div className="flex items-center gap-2">
              <ButtonHealth />
              <ThemeSwitcher />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
