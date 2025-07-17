"use client";

import { useSession } from "next-auth/react";
import { ProjectLimitBanner } from "@/components/banners/project-limit-banner";
import { BklitLogo } from "@/components/icons/bklit";
import { DashboardNavigation } from "@/components/nav/dashboard-navigation";
import { NavUser } from "@/components/nav/nav-user";
import { NavWorkspace } from "@/components/nav/nav-workspace";
import { Separator } from "@/components/ui/separator";

export function SiteHeader() {
  const { data: clientSession } = useSession();
  return (
    <header className="flex flex-col w-full">
      <div className="flex w-full items-center justify-between px-4 lg:px-6 border-b py-4">
        <div className="flex items-center gap-4">
          <BklitLogo size={32} />
          <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
          <div className="flex items-center gap-2">
            <NavWorkspace />
          </div>
        </div>
        <div className="flex items-center gap-1 lg:gap-2">
          <ProjectLimitBanner />
          {clientSession?.user && (
            <NavUser
              user={{
                name: clientSession.user.name || "",
                email: clientSession.user.email || "",
                avatar: clientSession.user.image || "",
                plan: clientSession.user.plan,
                id: clientSession.user.id,
              }}
            />
          )}
        </div>
      </div>
      <div className="flex w-full items-center justify-between px-4 lg:px-6 border-b py-4">
        <DashboardNavigation />
      </div>
    </header>
  );
}
