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
import { FolderKanban } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavProjectProps {
  projectName?: string;
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

export function NavProject({ projectName, items }: NavProjectProps) {
  const pathname = usePathname();

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

          return (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild isActive={isActive}>
                <Link href={item.href}>
                  <Icon />
                  <span>{item.title}</span>
                </Link>
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
