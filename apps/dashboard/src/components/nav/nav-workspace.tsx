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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@bklit/ui/components/popover";
import { ChevronsUpDown } from "lucide-react";
import Link from "next/link";
import { useWorkspace } from "@/contexts/workspace-provider";
import { getThemeGradient } from "@/lib/utils/get-organization-theme";
import type { User } from "@/types/user";
import { ModuleProjects } from "./module-projects";
import { ModuleWorkspaces } from "./module-workspaces";

export function NavWorkspace({ user }: { user: User }) {
  const { activeOrganization, activeProject } = useWorkspace();

  // Use organization plan from database
  const isPro = activeOrganization?.plan === "pro";
  const planName = isPro ? "Pro" : "Free";

  console.log("→", activeOrganization);

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
                  <span>{activeOrganization?.name}</span>

                  <Badge variant={isPro ? "default" : "secondary"}>
                    {planName}
                  </Badge>
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>

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
          </>
        )}

        {activeProject && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{activeProject.name}</BreadcrumbPage>
            </BreadcrumbItem>

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
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
