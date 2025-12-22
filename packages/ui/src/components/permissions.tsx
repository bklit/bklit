"use client";

import { Slot } from "@radix-ui/react-slot";
import { Lock } from "lucide-react";
import type * as React from "react";

interface PermissionsProps {
  children: React.ReactNode;
  hasAccess: boolean;
  asChild?: boolean;
  overlayMessage?: string;
  inModal?: boolean;
}

function Permissions({
  children,
  hasAccess,
  asChild = false,
  overlayMessage = "You don't have permission to access this feature",
  inModal = false,
}: PermissionsProps) {
  if (inModal && hasAccess) {
    return <>{children}</>;
  }

  if (hasAccess) {
    const Comp = asChild ? Slot : "div";
    return <Comp>{children}</Comp>;
  }

  if (inModal) {
    return (
      <div className="grid grid-cols-1 grid-rows-1">
        <div className="col-start-1 row-start-1 grid grid-cols-1 grid-rows-1">
          <div className="col-start-1 row-start-1" inert>
            {children}
          </div>
          <div className="col-start-1 row-start-1 -m-6 flex items-center justify-center rounded-xl border-2 border-border border-dashed bg-background/50 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2 p-6 text-center">
              <Lock className="size-8 text-muted-foreground" />
              <p className="max-w-xs text-muted-foreground text-sm">
                {overlayMessage}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 grid-rows-1">
      <div className="col-start-1 row-start-1" inert>
        {children}
      </div>
      <div className="col-start-1 row-start-1 flex items-center justify-center rounded-xl border-2 border-border border-dashed bg-background/50 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-2 p-6 text-center">
          <Lock className="size-8 text-muted-foreground" />
          <p className="max-w-xs text-muted-foreground text-sm">
            {overlayMessage}
          </p>
        </div>
      </div>
    </div>
  );
}

export { Permissions };
