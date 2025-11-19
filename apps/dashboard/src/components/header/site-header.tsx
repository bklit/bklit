"use client";

import { BklitLogo } from "@bklit/ui/icons/bklit";
import { authClient } from "@/auth/client";
import { NavUser } from "@/components/nav/nav-user";
import { NavWorkspace } from "@/components/nav/nav-workspace";
import { NotificationsPopover } from "./notifications-popover";
import { SiteSearch } from "./site-search";

export function SiteHeader() {
  const { data: clientSession } = authClient.useSession();

  const user = clientSession?.user && {
    name: clientSession.user.name || "",
    email: clientSession.user.email || "",
    avatar: clientSession.user.image || "",
    id: clientSession.user.id,
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex flex-col w-full bg-[radial-gradient(var(--bklit-700)_1px,transparent_1px)] bg-size-[16px_16px] before:content-[''] before:absolute before:inset-0 before:bg-linear-to-b before:from-transparent before:to-background before:z-0">
      <div className="flex relative w-full items-center justify-between px-4 lg:px-6 py-4">
        <div className="flex items-center gap-6">
          <BklitLogo size={32} className="dark:text-white text-black" />
          {user && <NavWorkspace user={user} />}
        </div>
        <div className="flex items-center gap-3">
          <SiteSearch />
          {user && (
            <>
              <NotificationsPopover />
              <NavUser user={user} />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
