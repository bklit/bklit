"use client";

import { Button } from "@bklit/ui/components/button";
import { useSidebar } from "@bklit/ui/components/sidebar";
import { useMediaQuery } from "@bklit/ui/hooks/use-media-query";
import { BklitLogo } from "@bklit/ui/icons/bklit";
import { PanelLeftIcon, PanelRightIcon } from "lucide-react";
import { authClient } from "@/auth/client";
import { NavUser } from "@/components/nav/nav-user";
import { NavWorkspace } from "@/components/nav/nav-workspace";
import { cn } from "@/lib/utils";
import { NotificationsPopover } from "./notifications-popover";
import { SiteSearch } from "./site-search";

export function SiteHeader() {
  const { data: clientSession } = authClient.useSession();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const user = clientSession?.user && {
    name:
      clientSession.user.name ||
      clientSession.user.email?.split("@")[0] ||
      "User",
    email: clientSession.user.email || "",
    avatar: clientSession.user.image || "",
    id: clientSession.user.id,
  };

  return (
    <header className="fixed top-0 right-0 left-0 z-50 flex w-full flex-col bg-background">
      <div className="relative flex w-full items-center justify-between px-4 py-4 lg:px-6">
        <div className="flex items-center gap-6">
          <BklitLogo
            className="hidden text-black sm:inline-flex dark:text-white"
            size={32}
          />
          {user && <NavWorkspace user={user} />}
        </div>
        <div className={cn("flex items-center gap-3", !isDesktop && "gap-2")}>
          <SiteSearch />
          {user && (
            <>
              <NotificationsPopover />
              <NavUser user={user} />
            </>
          )}
          {!isDesktop && <SidebarToggle />}
        </div>
      </div>
    </header>
  );
}

function SidebarToggle() {
  const { state, toggleSidebar } = useSidebar();

  return (
    <Button
      className="relative cursor-pointer"
      onClick={toggleSidebar}
      size="icon"
      variant="ghost"
    >
      {state === "expanded" ? <PanelLeftIcon /> : <PanelRightIcon />}
    </Button>
  );
}
