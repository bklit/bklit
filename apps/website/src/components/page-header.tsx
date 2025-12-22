"use client";
import { Badge } from "@bklit/ui/components/badge";
import { Button } from "@bklit/ui/components/button";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { LogoDropdown } from "./logo-dropdown";

export const PageHeader = () => {
  return (
    <header className="progressive-blur fixed z-50 flex w-full bg-linear-to-b from-background to-transparent p-3 py-5 md:py-3">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-start gap-3">
            <LogoDropdown />
            <Badge className="opacity-70 hover:opacity-100" variant="secondary">
              Beta
            </Badge>
          </div>
          <nav className="hidden p-4 md:block">
            <ul className="flex items-center gap-2">
              <li>
                <Button asChild variant="ghost">
                  <Link href="#features">Product</Link>
                </Button>
              </li>
              <li>
                <Button asChild variant="ghost">
                  <Link href="/pricing">Pricing</Link>
                </Button>
              </li>
              <li>
                <Button asChild variant="ghost">
                  <a
                    href="https://docs.bklit.com"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <ExternalLink size={16} />
                    Docs
                  </a>
                </Button>
              </li>
            </ul>
          </nav>

          <nav className="flex items-center gap-2">
            <Button asChild size="lg" variant="mono">
              <a href="https://app.bklit.com/signin" title="Sign in">
                Sign in
              </a>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
};
