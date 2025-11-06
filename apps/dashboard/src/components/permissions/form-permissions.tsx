"use client";

import { Permissions } from "@bklit/ui/components/permissions";
import { hasPermission, type MemberRole } from "@bklit/utils/roles";
import type * as React from "react";
import { useWorkspace } from "@/contexts/workspace-provider";

interface FormPermissionsProps {
  children: React.ReactNode;
  requiredRole: MemberRole;
  asChild?: boolean;
  fallback?: React.ReactNode;
}

export function FormPermissions({
  children,
  requiredRole,
  asChild = false,
  fallback = null,
}: FormPermissionsProps) {
  const workspace = useWorkspace();
  const userRole = workspace.activeOrganization?.members.find(
    (member) => member.userId === workspace.session.user.id,
  )?.role;

  const hasAccess = hasPermission(userRole, requiredRole);

  return (
    <Permissions hasAccess={hasAccess} asChild={asChild} fallback={fallback}>
      {children}
    </Permissions>
  );
}

