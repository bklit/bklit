"use client";

import { Badge } from "@bklit/ui/components/badge";
import { Button } from "@bklit/ui/components/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@bklit/ui/components/item";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@bklit/ui/components/navigation-menu";
import { useIsMobile } from "@bklit/ui/hooks/use-mobile";
import { cn } from "@bklit/ui/lib/utils";
import { CircleChevronRight } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { LogoDropdown } from "./logo-dropdown";

export const PageHeader = () => {
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const handleMenuOpen = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLinkClick = () => {
    if (isMobile && isMenuOpen) {
      setIsMenuOpen(false);
    }
  };

  return (
    <motion.header
      animate={{ y: 0, opacity: 1 }}
      className="fixed z-50 flex w-full bg-linear-to-b from-background to-transparent md:px-3 md:py-3"
      initial={isMobile ? { y: 0, opacity: 1 } : { y: 30, opacity: 0 }}
      transition={
        isMobile
          ? { duration: 0 }
          : {
              duration: 0.8,
              ease: "easeInOut",
              delay: 0.1,
            }
      }
    >
      <div className="container mx-auto max-w-5xl md:px-4">
        <motion.div
          className="grid grid-cols-12 items-center justify-between gap-2 border-b bg-background/60 p-4 px-4 backdrop-blur-sm md:rounded-3xl md:border"
          data-navbar
        >
          {/* Logo */}
          <div className="order-1 col-span-3 flex h-9 items-start gap-3 sm:pl-0 md:col-span-3 md:pl-3">
            <LogoDropdown onClick={handleLinkClick} />
            <Badge
              className="hidden opacity-70 hover:opacity-100 sm:block"
              variant="secondary"
            >
              Beta
            </Badge>
          </div>

          {/* Navigation */}
          <motion.nav
            animate={isMobile ? (isMenuOpen ? "visible" : "hidden") : "visible"}
            className={cn(
              "order-3 col-span-12 hidden w-full items-center justify-center py-4 md:order-2 md:col-span-6 md:flex md:h-9 md:py-0",
              isMobile && isMenuOpen && "visible flex md:hidden md:flex-col"
            )}
            initial="hidden"
            variants={{
              hidden: { opacity: 0, y: -7 },
              visible: {
                opacity: 1,
                y: 0,
                transition: isMobile
                  ? {
                      duration: 0,
                    }
                  : {
                      duration: 1.8,
                      ease: "easeInOut",
                      delay: 0,
                    },
              },
            }}
          >
            {isMobile ? (
              <motion.ul className="flex flex-col items-center gap-2">
                <motion.li
                  className="mb-0.5 font-medium text-[10px] text-muted-foreground uppercase tracking-wider"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: { duration: 0.18, delay: 0 },
                    },
                  }}
                >
                  Product
                </motion.li>
                <motion.li
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: { duration: 0.18, delay: 0.05 },
                    },
                  }}
                >
                  <Button asChild variant="ghost">
                    <Link href="/#product" onClick={handleLinkClick}>
                      Overview
                    </Link>
                  </Button>
                </motion.li>
                <motion.li
                  className="mb-3"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: { duration: 0.18, delay: 0.1 },
                    },
                  }}
                >
                  <Button asChild variant="ghost">
                    <Link href="/extensions" onClick={handleLinkClick}>
                      Extensions
                    </Link>
                  </Button>
                </motion.li>
                <motion.li
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: { duration: 0.18, delay: 0.15 },
                    },
                  }}
                >
                  <Button asChild variant="ghost">
                    <Link href="/pricing" onClick={handleLinkClick}>
                      Pricing
                    </Link>
                  </Button>
                </motion.li>
                <motion.li
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: { duration: 0.18, delay: 0.2 },
                    },
                  }}
                >
                  <Button asChild variant="ghost">
                    <Link href="/contact" onClick={handleLinkClick}>
                      Contact
                    </Link>
                  </Button>
                </motion.li>
                <motion.li
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: { duration: 0.18, delay: 0.25 },
                    },
                  }}
                >
                  <Button asChild variant="ghost">
                    <Link href="/updates" onClick={handleLinkClick}>
                      Updates
                    </Link>
                  </Button>
                </motion.li>
                <motion.li
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: { duration: 0.18, delay: 0.3 },
                    },
                  }}
                >
                  <Button asChild variant="ghost">
                    <a
                      href="https://docs.bklit.com"
                      onClick={handleLinkClick}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      Docs
                    </a>
                  </Button>
                </motion.li>
              </motion.ul>
            ) : (
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger>Product</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="grid w-[600px] grid-cols-2">
                        <ul className="flex flex-col gap-2 p-4">
                          <li>
                            <NavigationMenuLink asChild>
                              <Link href="/#product">
                                <div className="font-medium">Overview</div>
                                <div className="text-muted-foreground text-sm">
                                  See what Bklit can do for you
                                </div>
                              </Link>
                            </NavigationMenuLink>
                          </li>
                          <li>
                            <NavigationMenuLink asChild>
                              <Link href="/extensions">
                                <div className="font-medium">Extensions</div>
                                <div className="text-muted-foreground text-sm">
                                  Extend Bklit with powerful integrations
                                </div>
                              </Link>
                            </NavigationMenuLink>
                          </li>
                        </ul>
                        <ul className="flex flex-col gap-2 border-l p-4">
                          <li>
                            <NavigationMenuLink asChild>
                              <Link href="/#faqs">
                                <div className="font-medium">FAQs</div>
                                <div className="text-muted-foreground text-sm">
                                  Frequently asked questions
                                </div>
                              </Link>
                            </NavigationMenuLink>
                          </li>
                        </ul>
                      </div>
                      <footer className="border-border border-t bg-bklit-800/50">
                        <Item
                          className="cursor-pointer"
                          onClick={() =>
                            toast.info("Extension in review.", {
                              description: "Check out the GitHub repository...",
                              action: {
                                label: "GitHub",
                                onClick: () =>
                                  router.push(
                                    "https://github.com/bklit/bklit-raycast"
                                  ),
                              },
                            })
                          }
                          variant="ghost"
                        >
                          <ItemMedia>
                            <Image
                              alt="Raycast"
                              height={50}
                              src="/raycast-extension-icon.png"
                              // src="/RaycastiOS-AppIcon.webp"
                              width={50}
                            />
                          </ItemMedia>
                          <ItemContent>
                            <ItemTitle>Raycast Extension</ItemTitle>
                            <ItemDescription>
                              Get a daily digest on macOS & Windows desktop
                            </ItemDescription>
                          </ItemContent>
                          <ItemActions>
                            <CircleChevronRight
                              className="text-muted-foreground"
                              strokeWidth={1}
                            />
                          </ItemActions>
                        </Item>
                      </footer>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuLink
                      asChild
                      className={navigationMenuTriggerStyle()}
                    >
                      <Link href="/pricing">Pricing</Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuLink
                      asChild
                      className={navigationMenuTriggerStyle()}
                    >
                      <Link href="/contact">Contact</Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuLink
                      asChild
                      className={navigationMenuTriggerStyle()}
                    >
                      <Link href="/updates">Updates</Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuLink
                      asChild
                      className={navigationMenuTriggerStyle()}
                    >
                      <a
                        href="https://docs.bklit.com"
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        Docs
                      </a>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            )}
          </motion.nav>

          {/* CTA */}
          <nav className="order-2 col-span-9 flex h-9 items-center justify-end gap-2 md:order-3 md:col-span-3">
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
              className="flex size-7 shrink-0 appearance-none items-center justify-center md:hidden"
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
