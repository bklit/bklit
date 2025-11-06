"use client";

import { Permissions } from "@bklit/ui/components/permissions";
import { hasPermission, type MemberRole } from "@bklit/utils/roles";
import type * as React from "react";
import { useWorkspace } from "@/contexts/workspace-provider";

interface FormPermissionsProps {
  children: React.ReactNode;
  requiredRole: MemberRole;
  asChild?: boolean;
  overlayMessage?: string;
  inModal?: boolean;
}

const roleLabels: Record<string, string> = {
  owner: "organization owners",
  admin: "administrators",
  member: "members",
};

export function FormPermissions({
  children,
  requiredRole,
  asChild = false,
  overlayMessage,
  inModal = false,
}: FormPermissionsProps) {
  const workspace = useWorkspace();
  const userRole = workspace.activeOrganization?.members.find(
    (member) => member.userId === workspace.session.user.id,
  )?.role;

  const hasAccess = hasPermission(userRole, requiredRole);

  const defaultMessage =
    overlayMessage ||
    `This feature is only available to ${roleLabels[requiredRole] || requiredRole}`;

  return (
    <Permissions
      hasAccess={hasAccess}
      asChild={asChild}
      overlayMessage={defaultMessage}
      inModal={inModal}
    >
      {children}
    </Permissions>
  );
}
