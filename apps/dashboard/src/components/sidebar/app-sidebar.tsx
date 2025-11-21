"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarTrigger,
} from "@bklit/ui/components/sidebar";
import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { getNavigationItems, replaceDynamicParams } from "@/lib/navigation";
import { useTRPC } from "@/trpc/react";
import { NavProject } from "./nav-project";
import { NavWorkspace } from "./nav-workspace";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

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

  const isProjectLevel =
    segments.length >= 2 &&
    segments[1] !== "billing" &&
    segments[1] !== "settings" &&
    segments[1] !== "projects";

  const trpc = useTRPC();
  const { data: project } = useQuery({
    ...trpc.project.fetch.queryOptions({
      id: projectId ?? "",
      organizationId: organizationId ?? "",
    }),
    enabled: isProjectLevel && !!projectId && !!organizationId,
  });

  const { data: organization } = useQuery({
    ...trpc.organization.fetch.queryOptions({
      id: organizationId ?? "",
    }),
    enabled: !isProjectLevel && !!organizationId,
  });

  return (
    <Sidebar
      collapsible="icon"
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuButton asChild className="w-fit">
              <SidebarTrigger />
            </SidebarMenuButton>
          </SidebarMenu>
        </SidebarGroup>
        {isProjectLevel ? (
          <NavProject projectName={project?.name} items={resolvedItems} />
        ) : (
          <NavWorkspace
            workspaceName={organization?.name}
            items={resolvedItems}
          />
        )}
      </SidebarContent>
    </Sidebar>
  );
}
