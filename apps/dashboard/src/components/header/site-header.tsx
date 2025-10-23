"use client";

import { Separator } from "@bklit/ui/components/separator";
import { authClient } from "@/auth/client";
import { BklitLogo } from "@/components/icons/bklit";
import { DashboardNavigation } from "@/components/nav/dashboard-navigation";
import { NavUser } from "@/components/nav/nav-user";
import { NavWorkspace } from "@/components/nav/nav-workspace";
import { SiteSearch } from "./site-search";

export function SiteHeader() {
  const { data: clientSession } = authClient.useSession();

  return (
    <header className="flex flex-col w-full bg-bklit-900 border-b">
      <div className="flex w-full items-center justify-between px-4 lg:px-6 py-4">
        <div className="flex items-center gap-4">
          <BklitLogo size={32} />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />
          <div className="flex items-center gap-2">
            <NavWorkspace />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-between">
            <SiteSearch />
          </div>
          <div className="flex items-center gap-1 lg:gap-2">
            {clientSession?.user && (
              <NavUser
                user={{
                  name: clientSession.user.name || "",
                  email: clientSession.user.email || "",
                  avatar: clientSession.user.image || "",
                  id: clientSession.user.id,
                }}
              />
            )}
          </div>
        </div>
      </div>
      <div className="flex w-full items-center justify-between px-4 lg:px-6 py-4">
        <DashboardNavigation />
      </div>
    </header>
  );
}
