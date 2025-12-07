import Link from "next/link";
import { ButtonHealth } from "./button-health";
import { ThemeSwitcher } from "./theme-switcher";

export const Footer = () => {
  return (
    <div>
      <div className="block bg-linear-to-b from-transparent to-background h-48" />
      <footer className="bg-background mt-auto">
        <div className="container mx-auto max-w-6xl flex flex-col gap-24 px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-zinc-200 dark:border-zinc-900 pt-8">
            <div className="col-span-1 space-y-4">
              <h4 className="text-base font-bold">Company</h4>
              <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="/"
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
                    href="/"
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
                    href="/"
                    className="flex items-center gap-2 group transition-all duration-200 relative hover:text-foreground"
                  >
                    <span className="text-lime-200 transition duration-100 absolute left-0 opacity-0 group-hover:opacity-100 transition-delay-100">
                      ◑
                    </span>
                    <span className="transition-all duration-200 group-hover:translate-x-[20px]">
                      Pricing
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/"
                    className="flex items-center gap-2 group transition-all duration-200 relative hover:text-foreground"
                  >
                    <span className="text-lime-200 transition absolute left-0 opacity-0 group-hover:opacity-100">
                      ◑
                    </span>
                    <span className="transition-all duration-200 group-hover:translate-x-[20px]">
                      Contact
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/"
                    className="flex items-center gap-2 group transition-all duration-200 relative hover:text-foreground"
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
              <ul className="flex items-center gap-2 text-sm">
                <li>
                  <a
                    href="https://github.com/bklit/bklit"
                    title="Github"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Github
                  </a>
                </li>
                <li>
                  <a
                    href="https://x.com/bklitai"
                    title="X"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    X
                  </a>
                </li>
                <li>
                  <a
                    href="https://discord.gg/bklit"
                    title="Discord"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Discord
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between py-8 pt-0 md:pt-8 gap-2 md:gap-0">
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
