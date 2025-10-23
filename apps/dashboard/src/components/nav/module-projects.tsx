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
import { Folder, Plus } from "lucide-react";
import Link from "next/link";
import { useWorkspace } from "@/contexts/workspace-provider";

export const ModuleProjects = () => {
  const { activeOrganization, activeProject, onChangeProject } = useWorkspace();

  if (!activeOrganization) {
    return null;
  }

  return (
    <Command>
      <CommandInput placeholder="Find project" className="" />
      <CommandList>
        <CommandEmpty>No projects found.</CommandEmpty>
        <CommandGroup>
          {activeOrganization.projects?.map((project) => (
            <CommandItem
              value={project.id}
              key={project.id}
              onSelect={() =>
                onChangeProject(activeOrganization.id, project.id)
              }
              className="cursor-pointer h-12"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <span className="truncate">{project.name}</span>
                </div>
                {project.id === activeProject?.id && (
                  <Badge variant="secondary" className="text-xs">
                    Current
                  </Badge>
                )}
              </div>
            </CommandItem>
          ))}
          <CommandItem asChild className="cursor-pointer h-12">
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
