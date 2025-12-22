"use client";

import { Button } from "@bklit/ui/components/button";
import { useSidebar } from "@bklit/ui/components/sidebar";
import { useMediaQuery } from "@bklit/ui/hooks/use-media-query";
import { BklitLogo } from "@bklit/ui/icons/bklit";
import NumberFlow from "@number-flow/react";
import { PanelLeftIcon, PanelRightIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { authClient } from "@/auth/client";
import { NavUser } from "@/components/nav/nav-user";
import { NavWorkspace } from "@/components/nav/nav-workspace";
import { useLiveUsers } from "@/hooks/use-live-users";
import { cn } from "@/lib/utils";
import { NotificationsPopover } from "./notifications-popover";
import { SiteSearch } from "./site-search";

export function SiteHeader() {
  const { data: clientSession } = authClient.useSession();
  const params = useParams();
  const organizationId = params?.organizationId as string | undefined;
  const projectId = params?.projectId as string | undefined;
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const { liveUsers } = useLiveUsers({
    projectId: projectId ?? "",
    organizationId: organizationId ?? "",
  });

  const showLiveUsers = organizationId && projectId;
  const hasLiveUsers = liveUsers > 0;
  const shouldShow = showLiveUsers && hasLiveUsers;

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

          <AnimatePresence mode="wait">
            {shouldShow && (
              <motion.div
                animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                className="hidden items-center gap-2 font-medium text-muted-foreground text-xs sm:flex"
                exit={{ opacity: 0, scale: 0.8, y: -10, filter: "blur(4px)" }}
                initial={{
                  opacity: 0,
                  scale: 0.8,
                  y: -10,
                  filter: "blur(4px)",
                }}
                key="live-users"
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <div className="relative size-3">
                  <div className="absolute top-0 left-0 size-3 animate-ping rounded-full bg-red-400" />
                  <div className="absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-400" />
                  <div className="pointer-events-none absolute top-1/2 left-1/2 size-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-400 opacity-80 blur-xl" />
                </div>
                <Link
                  className="flex items-center gap-2 font-medium text-muted-foreground text-xs"
                  href={`/${organizationId}/${projectId}/live`}
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
