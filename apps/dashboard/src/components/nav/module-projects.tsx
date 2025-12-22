"use client";

import { Badge } from "@bklit/ui/components/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@bklit/ui/components/command";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useWorkspace } from "@/contexts/workspace-provider";

interface NavProject {
  id: string;
  name: string;
  organizationId: string;
}

export const ModuleProjects = () => {
  const { activeOrganization, activeProject, onChangeProject } = useWorkspace();

  if (!activeOrganization) {
    return null;
  }

  return (
    <Command>
      <CommandInput className="" placeholder="Find project" />
      <CommandList>
        <CommandEmpty>No projects found.</CommandEmpty>
        <CommandGroup>
          {activeOrganization.projects?.map((project: NavProject) => (
            <CommandItem
              className="h-12 cursor-pointer"
              key={project.id}
              onSelect={() =>
                onChangeProject(activeOrganization.id, project.id)
              }
              value={project.id}
            >
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="truncate">{project.name}</span>
                </div>
                {project.id === activeProject?.id && (
                  <Badge className="text-xs" variant="secondary">
                    Current
                  </Badge>
                )}
              </div>
            </CommandItem>
          ))}
          <CommandItem asChild className="h-12 cursor-pointer">
            <Link href={`/${activeOrganization.id}/projects/create`}>
              <Plus className="size-4" />
              Create new project
            </Link>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  );
};
