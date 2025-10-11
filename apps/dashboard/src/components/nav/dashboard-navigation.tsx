"use client";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@bklit/ui/components/navigation-menu";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getNavigationItems, replaceDynamicParams } from "@/lib/navigation";

export function DashboardNavigation() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  // Extract dynamic parameters from the current path
  const organizationId =
    segments[0] !== "user" && segments.length > 0 ? segments[0] : undefined;
  const projectId =
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
    projectId,
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
              <Link href={item.href} data-active={pathname === item.href}>
                {item.title}
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
