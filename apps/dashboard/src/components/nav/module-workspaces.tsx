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

interface NavOrganization {
  id: string;
  name: string;
}

export const ModuleWorkspaces = () => {
  const { organizations, activeOrganization, onChangeOrganization } =
    useWorkspace();

  return (
    <Command>
      <CommandInput placeholder="Find workspace" />
      <CommandList>
        <CommandEmpty>No workspaces found.</CommandEmpty>
        <CommandGroup heading="Workspaces">
          {organizations?.map((organization: NavOrganization) => (
            <CommandItem
              value={organization.id}
              key={organization.id}
              onSelect={() => onChangeOrganization(organization.id)}
              className="cursor-pointer"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <span className="truncate">{organization.name}</span>
                </div>
                {organization.id === activeOrganization?.id && (
                  <Badge variant="secondary" className="text-xs">
                    Current
                  </Badge>
                )}
              </div>
            </CommandItem>
          ))}
          <CommandItem asChild className="cursor-pointer">
            <Link href="/organizations/create">
              <Plus className="size-4" />
              Create new workspace
            </Link>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  );
};
