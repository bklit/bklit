interface NavigationItem {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface NavigationConfig {
  [key: string]: NavigationItem[];
}

export const navigationConfig: NavigationConfig = {
  // Organization level navigation (when at /[organizationId])
  organization: [
    {
      title: "Overview",
      href: "/[organizationId]",
    },
    {
      title: "Settings",
      href: "/[organizationId]/settings",
    },
  ],

  // Project level navigation (when at /[organizationId]/[projectId])
  project: [
    {
      title: "Overview",
      href: "/[organizationId]/[projectId]",
    },
    {
      title: "Sessions",
      href: "/[organizationId]/[projectId]/sessions",
    },
    {
      title: "Events",
      href: "/[organizationId]/[projectId]/events",
    },
    {
      title: "Pageviews",
      href: "/[organizationId]/[projectId]/pageviews",
    },
    {
      title: "Acquisitions",
      href: "/[organizationId]/[projectId]/acquisitions",
    },
    {
      title: "Settings",
      href: "/[organizationId]/[projectId]/settings",
    },
  ],

  // User level navigation (when at /user/[userId])
  user: [
    {
      title: "Profile",
      href: "/user/[userId]",
    },
  ],

  // Organization settings navigation
  organizationSettings: [
    {
      title: "General",
      href: "/[organizationId]/settings",
    },
    {
      title: "API Tokens",
      href: "/[organizationId]/settings/api-tokens",
    },
    {
      title: "Billing",
      href: "/[organizationId]/settings/billing",
    },
  ],

  // Project settings navigation
  projectSettings: [
    {
      title: "General",
      href: "/[organizationId]/[projectId]/settings",
    },
    {
      title: "Notifications",
      href: "/[organizationId]/[projectId]/settings/notifications",
    },
  ],
};

export function getNavigationItems(pathname: string): NavigationItem[] {
  const segments = pathname.split("/").filter(Boolean);

  // User level: /user/[userId]
  if (segments[0] === "user" && segments.length >= 2) {
    return navigationConfig.user ?? [];
  }

  // Project level: /[organizationId]/[projectId]/...
  // Exclude organization-level routes like settings, billing, projects
  if (
    segments.length >= 2 &&
    segments[1] !== "billing" &&
    segments[1] !== "settings" &&
    segments[1] !== "projects"
  ) {
    return navigationConfig.project ?? [];
  }

  // Organization level: /[organizationId], /[organizationId]/settings, /[organizationId]/projects, etc.
  if (segments.length >= 1 && segments[0] !== "user") {
    return navigationConfig.organization ?? [];
  }

  return [];
}

export function replaceDynamicParams(
  items: NavigationItem[],
  organizationId?: string,
  projectId?: string,
  userId?: string,
): NavigationItem[] {
  return items.map((item) => ({
    ...item,
    href: item.href
      .replace("[organizationId]", organizationId || "")
      .replace("[projectId]", projectId || "")
      .replace("[userId]", userId || ""),
  }));
}
