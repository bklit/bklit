"use client";

import { Button } from "@bklit/ui/components/button";
import { cn } from "@bklit/ui/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigationConfig, replaceDynamicParams } from "@/lib/navigation";

interface SettingsNavigationProps {
  type: "organizationSettings" | "projectSettings";
  organizationId: string;
  projectId?: string;
}

export function SettingsNavigation({
  type,
  organizationId,
  projectId,
}: SettingsNavigationProps) {
  const pathname = usePathname();
  const items = navigationConfig[type] ?? [];
  const resolvedItems = replaceDynamicParams(items, organizationId, projectId);

  return (
    <nav className="flex flex-col gap-px">
      {resolvedItems.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Button
            key={item.href}
            variant="ghost"
            asChild
            className={cn(
              "justify-start",
              isActive && "bg-accent text-accent-foreground",
            )}
          >
            <Link href={item.href}>{item.title}</Link>
          </Button>
        );
      })}
    </nav>
  );
}
