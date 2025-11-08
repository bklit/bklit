"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@bklit/ui/components/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@bklit/ui/components/dropdown-menu";
import { CreditCard, LayoutDashboard, LogOut, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/auth/client";
import { useWorkspace } from "@/contexts/workspace-provider";
import { ThemeToggle } from "../theme-toggle";

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
    plan?: string;
    id?: string;
  };
}) {
  const { activeOrganization } = useWorkspace();
  const router = useRouter();
  const billingHref = `/${activeOrganization?.id}/billing`;
  const dashboardHref = activeOrganization?.id
    ? `/${activeOrganization?.id}`
    : "/";

  const handleSignOut = async () => {
    const result = await authClient.signOut();
    if (result.error) {
      console.error("Sign out failed:", result.error);
      return;
    }
    router.push("/signin");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Avatar className="h-8 w-8 rounded-lg">
          <AvatarImage src={user.avatar} alt={user.name} />
          <AvatarFallback className="rounded-lg">
            {user.name?.[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
        side="bottom"
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="rounded-lg">CN</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="truncate text-xs">{user.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex justify-center">
            <ThemeToggle />
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href={dashboardHref}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Overview
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/user/${user.id || "profile"}`}>
              <User className="mr-2 h-4 w-4" />
              My Workspaces
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={billingHref}>
              <CreditCard className="mr-2 h-4 w-4" />
              Billing for {activeOrganization?.name}
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
