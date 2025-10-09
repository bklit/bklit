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
import { ChevronsUpDown, Users } from "lucide-react";
import Link from "next/link";
import { useWorkspace } from "@/contexts/workspace-provider";
import { ModuleWorkspaces } from "./module-workspaces";

export function NavWorkspace() {
  const { activeOrganization, activeProject } = useWorkspace();

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link
                href={`/${activeOrganization?.id}`}
                className="flex items-center gap-2"
              >
                <Users className="size-4" />
                <span>{activeOrganization?.name}</span>

                <Badge variant="default" asChild>
                  <Link href={`/${activeOrganization?.id}/settings/billing`}>
                    Pro
                  </Link>
                </Badge>
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>

          {activeProject && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{activeProject.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon">
            <ChevronsUpDown className="size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="rounded-lg p-0 min-w-max"
          side="bottom"
          align="start"
          sideOffset={4}
        >
          <ModuleWorkspaces />
        </PopoverContent>
      </Popover>
    </>
  );
}
