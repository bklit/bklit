import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@bklit/ui/components/avatar";
import { Badge } from "@bklit/ui/components/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@bklit/ui/components/breadcrumb";
import { Button } from "@bklit/ui/components/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@bklit/ui/components/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@bklit/ui/components/popover";
import { useMediaQuery } from "@bklit/ui/hooks/use-media-query";
import { cn } from "@bklit/ui/lib/utils";
import { ChevronsUpDown } from "lucide-react";
import Link from "next/link";
import { useWorkspace } from "@/contexts/workspace-provider";
import { getThemeGradient } from "@/lib/utils/get-organization-theme";
import type { User } from "@/types/user";
import { ModuleProjects } from "./module-projects";
import { ModuleWorkspaces } from "./module-workspaces";

export function NavWorkspace({ user }: { user: User }) {
  const { activeOrganization, activeProject } = useWorkspace();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // Use organization plan from database
  const isPro = activeOrganization?.plan === "pro";
  const planName = isPro ? "Pro" : "Free";

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {!activeOrganization ? (
          <>
            <BreadcrumbItem className="flex items-center gap-2">
              <Avatar className="size-4">
                <AvatarImage src={user.avatar || ""} />
                <AvatarFallback>{user.name?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <span>{user.name}'s Workspaces</span>
            </BreadcrumbItem>
            {isDesktop ? (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <ChevronsUpDown className="size-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="rounded-lg p-0 min-w-max">
                  <ModuleWorkspaces />
                </PopoverContent>
              </Popover>
            ) : (
              <Drawer>
                <DrawerTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <ChevronsUpDown className="size-4" />
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>Workspaces</DrawerTitle>
                  </DrawerHeader>
                  <ModuleWorkspaces />
                </DrawerContent>
              </Drawer>
            )}
          </>
        ) : (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link
                  href={`/${activeOrganization?.id}`}
                  className="flex items-center gap-2"
                >
                  <Avatar className="size-4">
                    <AvatarImage src={activeOrganization?.logo || ""} />
                    <AvatarFallback
                      className={getThemeGradient(activeOrganization?.theme)}
                    />
                  </Avatar>
                  <span
                    className={cn(
                      "hidden sm:inline-flex",
                      !activeProject && "inline-flex",
                    )}
                  >
                    {activeOrganization?.name}
                  </span>

                  <Badge
                    variant={isPro ? "default" : "secondary"}
                    className="hidden sm:inline-flex"
                  >
                    {planName}
                  </Badge>
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>

            {isDesktop ? (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <ChevronsUpDown className="size-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="rounded-lg p-0 min-w-max">
                  <ModuleWorkspaces />
                </PopoverContent>
              </Popover>
            ) : (
              <Drawer>
                <DrawerTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <ChevronsUpDown className="size-4" />
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>Workspaces</DrawerTitle>
                  </DrawerHeader>
                  <ModuleWorkspaces />
                </DrawerContent>
              </Drawer>
            )}
          </>
        )}

        {activeProject && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{activeProject.name}</BreadcrumbPage>
            </BreadcrumbItem>

            {isDesktop ? (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <ChevronsUpDown className="size-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="rounded-lg p-0 min-w-max">
                  <ModuleProjects />
                </PopoverContent>
              </Popover>
            ) : (
              <Drawer>
                <DrawerTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <ChevronsUpDown className="size-4" />
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>Projects</DrawerTitle>
                  </DrawerHeader>
                  <ModuleProjects />
                </DrawerContent>
              </Drawer>
            )}
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
