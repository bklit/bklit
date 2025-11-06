export const MemberRole = {
  OWNER: "owner",
  ADMIN: "admin",
  MEMBER: "member",
} as const;

export type MemberRole = (typeof MemberRole)[keyof typeof MemberRole];

export enum PermissionLevel {
  OWNER = 3,
  ADMIN = 2,
  MEMBER = 1,
  NONE = 0,
}

export function getRolePermissionLevel(role?: string | null): PermissionLevel {
  switch (role) {
    case MemberRole.OWNER:
      return PermissionLevel.OWNER;
    case MemberRole.ADMIN:
      return PermissionLevel.ADMIN;
    case MemberRole.MEMBER:
      return PermissionLevel.MEMBER;
    default:
      return PermissionLevel.NONE;
  }
}

export function hasPermission(
  userRole: string | undefined | null,
  requiredRole: MemberRole,
): boolean {
  const userLevel = getRolePermissionLevel(userRole);
  const requiredLevel = getRolePermissionLevel(requiredRole);
  return userLevel >= requiredLevel;
}

export function getUserRole<T extends { userId: string; role: string }>(
  members: T[] | undefined,
  userId: string | undefined,
): string | undefined {
  if (!members || !userId) {
    return undefined;
  }
  return members.find((member) => member.userId === userId)?.role;
}
