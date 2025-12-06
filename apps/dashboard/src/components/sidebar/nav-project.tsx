"use client";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@bklit/ui/components/sidebar";
import { cn } from "@bklit/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { FolderKanban } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTRPC } from "@/trpc/react";

interface NavProjectProps {
  projectName?: string;
  projectId?: string;
  organizationId?: string;
  items: {
    title: string;
    href: string;
    icon?: React.ComponentType<{ className?: string }>;
    items?: {
      title: string;
      href: string;
    }[];
  }[];
}

export function NavProject({
  projectName,
  projectId,
  organizationId,
  items,
}: NavProjectProps) {
  const pathname = usePathname();
  const trpc = useTRPC();

  const { data: liveUsers = 0 } = useQuery({
    ...trpc.session.liveUsers.queryOptions({
      projectId: projectId ?? "",
      organizationId: organizationId ?? "",
    }),
    enabled: !!projectId && !!organizationId,
  });

  if (items.length === 0) {
    return null;
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{projectName || "Project"}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const Icon = item.icon || FolderKanban;
          const isActive = item.items?.length
            ? pathname.startsWith(item.href)
            : pathname === item.href;
          const isLiveItem = item.href.includes("/live");
          const isEnabled = !isLiveItem || liveUsers >= 1;

          return (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={isActive}
                disabled={!isEnabled}
              >
                {isEnabled ? (
                  <Link href={item.href}>
                    <Icon />
                    <span>{item.title}</span>
                  </Link>
                ) : (
                  <div
                    className={cn(
                      isLiveItem &&
                        "opacity-50 cursor-not-allowed hover:opacity-50",
                    )}
                  >
                    <Icon />
                    <span>{item.title}</span>
                  </div>
                )}
              </SidebarMenuButton>
              {isActive && item.items?.length ? (
                <SidebarMenuSub>
                  {item.items.map((subItem) => {
                    const isSubItemActive = pathname === subItem.href;
                    return (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={isSubItemActive}
                        >
                          <Link href={subItem.href}>{subItem.title}</Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    );
                  })}
                </SidebarMenuSub>
              ) : null}
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
