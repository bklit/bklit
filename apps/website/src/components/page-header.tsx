"use client";
import { Badge } from "@bklit/ui/components/badge";
import { Button } from "@bklit/ui/components/button";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { LogoDropdown } from "./logo-dropdown";

export const PageHeader = () => {
  return (
    <header className="fixed z-50 w-full flex p-3 py-5 md:py-3 bg-linear-to-b from-background to-transparent progressive-blur">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-2 justify-between">
          <div className="flex items-start gap-3">
            <LogoDropdown />
            <Badge variant="secondary" className="opacity-70 hover:opacity-100">
              Beta
            </Badge>
          </div>
          <nav className="p-4 hidden md:block">
            <ul className="flex items-center gap-2">
              <li>
                <Button variant="ghost" asChild>
                  <Link href="#features">Product</Link>
                </Button>
              </li>
              <li>
                <Button variant="ghost" asChild>
                  <Link href="/pricing">Pricing</Link>
                </Button>
              </li>
              <li>
                <Button variant="ghost" asChild>
                  <a
                    href="https://docs.bklit.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink size={16} />
                    Docs
                  </a>
                </Button>
              </li>
            </ul>
          </nav>

          <nav className="flex items-center gap-2">
            <Button size="lg" variant="mono" asChild>
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
