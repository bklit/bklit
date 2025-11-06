"use client";

import { Slot } from "@radix-ui/react-slot";
import { Lock } from "lucide-react";
import type * as React from "react";

interface PermissionsProps {
  children: React.ReactNode;
  hasAccess: boolean;
  asChild?: boolean;
  overlayMessage?: string;
}

function Permissions({
  children,
  hasAccess,
  asChild = false,
  overlayMessage = "You don't have permission to access this feature",
}: PermissionsProps) {
  if (hasAccess) {
    const Comp = asChild ? Slot : "div";
    return <Comp>{children}</Comp>;
  }

  // When no access, wrap in grid overlay
  return (
    <div className="grid grid-cols-1 grid-rows-1 relative">
      <div className="col-start-1 row-start-1" inert>
        {children}
      </div>
      <div className="col-start-1 row-start-1 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-md">
        <div className="flex flex-col items-center gap-2 p-6 text-center">
          <Lock className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground max-w-xs">
            {overlayMessage}
          </p>
        </div>
      </div>
    </div>
  );
}

export { Permissions };
