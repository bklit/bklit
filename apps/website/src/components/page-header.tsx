"use client";
import { Badge } from "@bklit/ui/components/badge";
import { Button } from "@bklit/ui/components/button";
import Link from "next/link";
import { LogoDropdown } from "./logo-dropdown";

export const PageHeader = () => {
  return (
    <header className="fixed z-50 flex w-full bg-linear-to-b from-background to-transparent py-5 sm:px-3 md:py-3">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between gap-2 rounded-xl border bg-background/60 py-1 backdrop-blur-sm sm:px-4">
          <div className="flex items-start gap-3 pl-3 sm:pl-0">
            <LogoDropdown />
            <Badge
              className="hidden opacity-70 hover:opacity-100 sm:block"
              variant="secondary"
            >
              Beta
            </Badge>
          </div>
          <nav className="hidden p-4 md:block">
            <ul className="flex items-center gap-2">
              <li>
                <Button asChild variant="ghost">
                  <Link href="/#product">Product</Link>
                </Button>
              </li>
              <li>
                <Button asChild variant="ghost">
                  <Link href="/pricing">Pricing</Link>
                </Button>
              </li>
              <li>
                <Button asChild variant="ghost">
                  <Link href="/contact">Contact</Link>
                </Button>
              </li>
              <li>
                <Button asChild variant="ghost">
                  <Link href="/updates">Updates</Link>
                </Button>
              </li>
              <li>
                <Button asChild variant="ghost">
                  <a
                    href="https://docs.bklit.com"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Docs
                  </a>
                </Button>
              </li>
            </ul>
          </nav>

          <nav className="flex items-center gap-2">
            <Button asChild size="lg" variant="ghost">
              <a
                data-bklit-event="signin-button"
                href="https://app.bklit.com/signin"
                rel="noopener noreferrer"
                target="_blank"
                title="Sign in"
              >
                Sign in
              </a>
            </Button>
            <Button asChild size="lg" variant="mono">
              <a
                data-bklit-event="signup-button"
                href="https://app.bklit.com/signup"
                rel="noopener noreferrer"
                target="_blank"
                title="Sign up"
              >
                Sign up
              </a>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
};
