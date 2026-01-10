"use client";

import { Badge } from "@bklit/ui/components/badge";
import { Button } from "@bklit/ui/components/button";
import { useIsMobile } from "@bklit/ui/hooks/use-mobile";
import { cn } from "@bklit/ui/lib/utils";
import { motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { LogoDropdown } from "./logo-dropdown";

export const PageHeader = () => {
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleMenuOpen = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <motion.header
      animate={{ y: 0, opacity: 1 }}
      className="fixed z-50 flex w-full bg-linear-to-b from-background to-transparent md:px-3 md:py-3"
      initial={{ y: 30, opacity: 0 }}
      transition={{
        duration: 0.8,
        ease: "easeInOut",
        delay: 0.1,
      }}
    >
      <div className="container mx-auto max-w-7xl md:px-4">
        <motion.div
          className="grid grid-cols-12 items-center justify-between gap-2 border-b bg-background/60 p-4 px-4 backdrop-blur-sm md:rounded-3xl md:border"
          data-navbar
        >
          {/* Logo */}
          <div className="order-1 col-span-6 flex h-9 items-start gap-3 border border-emerald-300 sm:pl-0 md:col-span-3 md:pl-3">
            <LogoDropdown />
            <Badge
              className="hidden opacity-70 hover:opacity-100 sm:block"
              variant="secondary"
            >
              Beta
            </Badge>
          </div>

          {/* Navigation */}
          <motion.nav
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "order-3 col-span-12 hidden items-center justify-center border border-emerald-300 md:order-2 md:col-span-6 md:flex md:h-9",
              isMenuOpen && "visible flex border-rose-500 md:hidden md:flex-col"
            )}
            initial={{ opacity: 0, y: -7 }}
            transition={{
              duration: 1.2,
              ease: "easeInOut",
              delay: 0.1,
            }}
          >
            <ul className="flex flex-col items-center gap-2 md:flex-row">
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
          </motion.nav>

          {/* CTA */}
          <nav className="order-2 col-span-6 flex h-9 items-center justify-end gap-2 border border-emerald-300 md:order-3 md:col-span-3">
            <Button asChild size={isMobile ? "sm" : "default"} variant="ghost">
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
            <Button asChild size={isMobile ? "sm" : "default"} variant="mono">
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

            {/* Mobile Menu */}
            <button
              className="flex size-7 items-center justify-center"
              onClick={handleMenuOpen}
              type="button"
            >
              <div className="relative size-3">
                <div
                  className={cn(
                    "absolute top-1/4 left-0 h-0.5 w-full bg-white transition-all duration-200",
                    isMenuOpen && "top-0"
                  )}
                />
                <div
                  className={cn(
                    "absolute top-1/4 left-0 h-0.5 w-full translate-y-0 bg-white transition-all duration-200",
                    isMenuOpen && "top-1/2 translate-y-[-50%] opacity-80"
                  )}
                />
                <div
                  className={cn(
                    "absolute bottom-1/4 left-0 h-0.5 w-full bg-white transition-all duration-300",
                    isMenuOpen && "bottom-0 opacity-60"
                  )}
                />
              </div>
            </button>
          </nav>
        </motion.div>
      </div>
    </motion.header>
  );
};
