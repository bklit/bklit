"use client";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@bklit/ui/components/navigation-menu";
import { cn } from "@bklit/ui/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getNavigationItems, replaceDynamicParams } from "@/lib/navigation";

export function DashboardNavigation() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  // Extract dynamic parameters from the current path
  const organizationId =
    segments[0] !== "user" && segments.length > 0 ? segments[0] : undefined;
  const siteId =
    segments.length > 1 &&
    segments[1] !== "billing" &&
    segments[1] !== "settings"
      ? segments[1]
      : undefined;
  const userId =
    segments[0] === "user" && segments.length > 1 ? segments[1] : undefined;

  const navigationItems = getNavigationItems(pathname);
  const resolvedItems = replaceDynamicParams(
    navigationItems,
    organizationId,
    siteId,
    userId,
  );

  // Don't render navigation if no items
  if (resolvedItems.length === 0) {
    return null;
  }

  return (
    <NavigationMenu>
      <NavigationMenuList>
        {resolvedItems.map((item) => (
          <NavigationMenuItem key={item.href}>
            <NavigationMenuLink asChild>
              <Link
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === item.href
                    ? "text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {item.title}
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
