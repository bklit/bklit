"use client";

import { BklitLogo } from "@bklit/ui/icons/bklit";
import NumberFlow from "@number-flow/react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { authClient } from "@/auth/client";
import { NavUser } from "@/components/nav/nav-user";
import { NavWorkspace } from "@/components/nav/nav-workspace";
import { useLiveUsers } from "@/hooks/use-live-users";
import { NotificationsPopover } from "./notifications-popover";
import { SiteSearch } from "./site-search";

export function SiteHeader() {
  const { data: clientSession } = authClient.useSession();
  const params = useParams();
  const organizationId = params?.organizationId as string | undefined;
  const projectId = params?.projectId as string | undefined;

  const { liveUsers } = useLiveUsers({
    projectId: projectId ?? "",
    organizationId: organizationId ?? "",
  });

  const showLiveUsers = organizationId && projectId;
  const hasLiveUsers = liveUsers > 0;
  const shouldShow = showLiveUsers && hasLiveUsers;

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

          <AnimatePresence mode="wait">
            {shouldShow && (
              <motion.div
                key="live-users"
                initial={{
                  opacity: 0,
                  scale: 0.8,
                  y: -10,
                  filter: "blur(4px)",
                }}
                animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.8, y: -10, filter: "blur(4px)" }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="flex items-center gap-2 text-xs text-muted-foreground font-medium"
              >
                <div className="size-3 relative">
                  <div className="absolute top-0 left-0 size-3 rounded-full bg-red-400 animate-ping" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-2 rounded-full bg-red-400" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-7 rounded-full bg-red-400 pointer-events-none blur-xl opacity-80" />
                </div>
                <Link
                  href={`/${organizationId}/${projectId}/live`}
                  className="flex items-center gap-2 text-xs text-muted-foreground font-medium"
                >
                  <span>
                    <NumberFlow value={liveUsers} />
                  </span>
                  <span>Live users</span>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
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
