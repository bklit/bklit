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
import { Plus, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useWorkspace } from "@/contexts/workspace-provider";

export const ModuleWorkspaces = () => {
  const {
    organizations,
    activeOrganization,
    activeProject,
    onChangeOrganization,
    onChangeProject,
  } = useWorkspace();

  const [hoveredOrganization, setHoveredOrganization] = useState<string | null>(
    null,
  );
  const hoveredOrganizationData = hoveredOrganization
    ? organizations?.find((t) => t.id === hoveredOrganization)
    : activeOrganization;

  return (
    <div className="flex items-start">
      {/* Left Column - Organizations */}
      <div className="border-r w-64">
        <Command value={hoveredOrganizationData?.id}>
          <CommandInput placeholder="Find organization" />
          <CommandList>
            <CommandEmpty>No organizations found.</CommandEmpty>
            <CommandGroup heading="Organizations">
              {organizations?.map((organization) => (
                <CommandItem
                  value={organization.id}
                  key={organization.id}
                  onSelect={() => onChangeOrganization(organization.id)}
                  onMouseEnter={() => setHoveredOrganization(organization.id)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Users className="size-4" />
                      <span className="truncate">{organization.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-xs">
                        {organization.projects.length} projects
                      </Badge>
                      {organization.id === activeOrganization?.id && (
                        <Badge variant="secondary" className="text-xs">
                          Current
                        </Badge>
                      )}
                    </div>
                  </div>
                </CommandItem>
              ))}
              <CommandItem asChild className="cursor-pointer">
                <Link href="/organizations/create">
                  <Plus className="size-4" />
                  Create new organization
                </Link>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </div>

      {/* Right Column - Projects for selected organization */}
      <div className="w-64">
        <Command>
          <CommandInput placeholder="Find project" />
          <CommandList>
            <CommandEmpty>
              {hoveredOrganizationData
                ? `No projects found in ${hoveredOrganizationData.name}`
                : "Select an organization to view projects"}
            </CommandEmpty>
            <CommandGroup
              heading={`Projects in ${hoveredOrganizationData?.name || "Organization"}`}
            >
              {hoveredOrganizationData?.projects.map((project) => (
                <CommandItem
                  value={project.id}
                  key={project.id}
                  onSelect={() =>
                    onChangeProject(hoveredOrganizationData.id, project.id)
                  }
                  className="cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="truncate">{project.name}</span>
                    {project.id === activeProject?.id && (
                      <Badge variant="secondary" className="text-xs">
                        Active
                      </Badge>
                    )}
                  </div>
                </CommandItem>
              ))}
              {hoveredOrganizationData && (
                <CommandItem className="cursor-pointer" asChild>
                  <Link
                    prefetch
                    href={`/${hoveredOrganizationData.id}/projects/create`}
                  >
                    <Plus className="mr-2 size-4" />
                    Add new project
                  </Link>
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </div>
    </div>
  );
};
