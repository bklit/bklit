"use client";

import { Button } from "@bklit/ui/components/button";
import { useSidebar } from "@bklit/ui/components/sidebar";
import { cn } from "@bklit/ui/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigationConfig, replaceDynamicParams } from "@/lib/navigation";

interface SubNavigationProps {
  configKey: string;
  organizationId: string;
  projectId?: string;
}

export function SubNavigation({
  configKey,
  organizationId,
  projectId,
}: SubNavigationProps) {
  const { open } = useSidebar();
  const pathname = usePathname();
  const items = navigationConfig[configKey] ?? [];
  const resolvedItems = replaceDynamicParams(items, organizationId, projectId);

  if (open) {
    return null;
  }
  return (
    <nav className="flex flex-row gap-px">
      {resolvedItems.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Button
            asChild
            className={cn(
              "justify-start",
              isActive && "bg-accent text-accent-foreground"
            )}
            key={item.href}
            variant="ghost"
          >
            <Link href={item.href}>{item.title}</Link>
          </Button>
        );
      })}
    </nav>
  );
}
