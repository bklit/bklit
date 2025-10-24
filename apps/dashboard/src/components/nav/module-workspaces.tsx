"use client";

import type { AppRouter } from "@bklit/api";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@bklit/ui/components/avatar";
import { Badge } from "@bklit/ui/components/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@bklit/ui/components/command";
import type { inferRouterOutputs } from "@trpc/server";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useWorkspace } from "@/contexts/workspace-provider";
import { cn } from "@/lib/utils";
import { getThemeGradient } from "@/lib/utils/get-organization-theme";

type Organization = inferRouterOutputs<AppRouter>["organization"]["list"][0];

export const ModuleWorkspaces = () => {
  const { organizations, activeOrganization, onChangeOrganization } =
    useWorkspace();

  return (
    <Command>
      <CommandInput placeholder="Find workspace" />
      <CommandList>
        <CommandEmpty>No workspaces found.</CommandEmpty>
        <CommandGroup heading="Workspaces">
          {organizations?.map((organization: Organization) => {
            const isPro = organization.plan === "pro";
            const planName = isPro ? "Pro" : "Free";
            const isCurrent = organization.id === activeOrganization?.id;

            return (
              <CommandItem
                value={organization.name}
                key={organization.id}
                onSelect={() => onChangeOrganization(organization.id)}
                className="cursor-pointer"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <Avatar
                      className={cn(
                        "size-4",
                        isCurrent &&
                          "ring-1 ring-white ring-offset-2 ring-offset-background",
                      )}
                    >
                      <AvatarImage src={organization.logo || ""} />
                      <AvatarFallback
                        className={cn(
                          getThemeGradient(organization.theme),
                          isCurrent && "ring-2 ring-ring",
                        )}
                      />
                    </Avatar>
                    <span className="truncate">{organization.name}</span>
                  </div>
                  <Badge variant={isPro ? "default" : "secondary"}>
                    {planName}
                  </Badge>
                </div>
              </CommandItem>
            );
          })}
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
