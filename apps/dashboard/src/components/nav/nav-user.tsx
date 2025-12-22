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
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@bklit/ui/components/item";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from "@bklit/ui/components/sheet";
import { useMediaQuery } from "@bklit/ui/hooks/use-media-query";
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

  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Avatar className="size-9">
            <AvatarImage alt={user.name} src={user.avatar} />
            <AvatarFallback className="rounded-lg">
              {user.name?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
          side="bottom"
          sideOffset={4}
        >
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar className="size-9 border border-input">
                <AvatarImage alt={user.name} src={user.avatar} />
                <AvatarFallback className="rounded-lg">
                  {user.name?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-muted-foreground text-xs">
                  {user.email}
                </span>
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
                <LayoutDashboard className="mr-2 size-3" />
                Overview
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/user/${user.id || "profile"}`}>
                <User className="mr-2 size-3" />
                My Workspaces
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={billingHref}>
                <CreditCard className="mr-2 size-3" />
                Billing for {activeOrganization?.name}
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="mr-2 size-3" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Avatar className="size-9">
          <AvatarImage alt={user.name} src={user.avatar} />
          <AvatarFallback className="rounded-lg">
            {user.name?.[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </SheetTrigger>
      <SheetContent className="w-[calc(80vw-2rem)]" side="right">
        <SheetHeader>
          <Item>
            <ItemContent>
              <ItemTitle>{user.name}</ItemTitle>
              <ItemDescription>{user.email}</ItemDescription>
            </ItemContent>
            <ItemActions>
              <Avatar className="size-4">
                <AvatarImage alt={user.name} src={user.avatar} />
                <AvatarFallback className="rounded-lg">
                  {user.name?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </ItemActions>
          </Item>
        </SheetHeader>
        <div className="flex flex-col gap-1 p-4">
          <Item asChild size="sm">
            <Link href={dashboardHref}>
              <ItemContent>Overview</ItemContent>
              <ItemActions>
                <LayoutDashboard className="mr-2 size-3" />
              </ItemActions>
            </Link>
          </Item>
          <Item asChild size="sm">
            <Link href={`/user/${user.id || "profile"}`}>
              <ItemContent>My Workspaces</ItemContent>
              <ItemActions>
                <User className="mr-2 size-3" />
              </ItemActions>
            </Link>
          </Item>
          <Item asChild size="sm">
            <Link href={billingHref}>
              <ItemContent>Billing for {activeOrganization?.name}</ItemContent>
              <ItemActions>
                <CreditCard className="mr-2 size-3" />
              </ItemActions>
            </Link>
          </Item>
          <Item size="sm">
            <ItemContent>Theme</ItemContent>
            <ItemActions>
              <ThemeToggle />
            </ItemActions>
          </Item>
          <Item onClick={handleSignOut}>
            <ItemContent>Log out</ItemContent>
          </Item>
        </div>
      </SheetContent>
    </Sheet>
  );
}
