"use client";

import { Slot } from "@radix-ui/react-slot";
import type * as React from "react";

interface PermissionsProps {
  children: React.ReactNode;
  hasAccess: boolean;
  asChild?: boolean;
  fallback?: React.ReactNode;
}

function Permissions({
  children,
  hasAccess,
  asChild = false,
  fallback = null,
}: PermissionsProps) {
  if (!hasAccess) {
    return fallback;
  }

  const Comp = asChild ? Slot : "div";

  return <Comp>{children}</Comp>;
}

export { Permissions };

