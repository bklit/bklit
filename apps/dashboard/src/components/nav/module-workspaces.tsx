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
import { useQuery } from "@tanstack/react-query";
import { CirclePlus } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useWorkspace } from "@/contexts/workspace-provider";
import { cn } from "@/lib/utils";
import { getThemeGradient } from "@/lib/utils/get-organization-theme";
import { useTRPC } from "@/trpc/react";

type Organization = inferRouterOutputs<AppRouter>["organization"]["list"][0];

export const ModuleWorkspaces = () => {
  const trpc = useTRPC();
  const { organizationId } = useParams();
  const { onChangeOrganization } = useWorkspace();

  // Fetch organizations client-side
  const { data: organizations = [] } = useQuery(
    trpc.organization.list.queryOptions(),
  );

  const activeOrganization = organizations.find(
    (org) => org.id === organizationId,
  );

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
                className="cursor-pointer h-10"
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
          <CommandItem asChild className="cursor-pointer h-10 group">
            <Link href="/organizations/create">
              <CirclePlus className="transition duration-100 size-4 text-brand-300 group-hover:text-white" />
              Create new workspace
            </Link>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  );
};
