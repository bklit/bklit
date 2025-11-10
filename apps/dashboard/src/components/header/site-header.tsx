"use client";

import { Separator } from "@bklit/ui/components/separator";
import { BklitLogo } from "@bklit/ui/icons/bklit";
import { authClient } from "@/auth/client";
import { DashboardNavigation } from "@/components/nav/dashboard-navigation";
import { NavUser } from "@/components/nav/nav-user";
import { NavWorkspace } from "@/components/nav/nav-workspace";
import { NotificationsPopover } from "./notifications-popover";
import { SiteSearch } from "./site-search";

export function SiteHeader() {
  const { data: clientSession } = authClient.useSession();

  return (
    <header className="flex relative flex-col w-full bg-[radial-gradient(var(--bklit-700)_1px,transparent_1px)] bg-size-[16px_16px] before:content-[''] before:absolute before:inset-0 before:bg-linear-to-b before:from-transparent before:to-background before:z-0">
      <div className="flex relative w-full items-center justify-between px-4 lg:px-6 py-4">
        <div className="flex items-center gap-4">
          <BklitLogo size={32} className="dark:text-white text-black" />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />
          <div className="flex items-center gap-2">
            <NavWorkspace />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <SiteSearch />
          {clientSession?.user && (
            <>
              <NotificationsPopover />
              <NavUser
                user={{
                  name: clientSession.user.name || "",
                  email: clientSession.user.email || "",
                  avatar: clientSession.user.image || "",
                  id: clientSession.user.id,
                }}
              />
            </>
          )}
        </div>
      </div>
      <div className="relative flex w-full items-center justify-between px-4 lg:px-6 py-4">
        <DashboardNavigation />
      </div>
    </header>
  );
}
