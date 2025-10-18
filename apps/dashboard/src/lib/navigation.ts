interface NavigationItem {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface NavigationConfig {
  [key: string]: NavigationItem[];
}

export const navigationConfig: NavigationConfig = {
  // Team level navigation (when at /[teamId])
  team: [
    {
      title: "Overview",
      href: "/[teamId]",
    },
    {
      title: "Settings",
      href: "/[teamId]/settings",
    },
  ],

  // Site level navigation (when at /[teamId]/[projectId])
  site: [
    {
      title: "Overview",
      href: "/[teamId]/[projectId]",
    },
    {
      title: "Sessions",
      href: "/[teamId]/[projectId]/sessions",
    },
    {
      title: "Events",
      href: "/[teamId]/[projectId]/events",
    },
    {
      title: "Settings",
      href: "/[teamId]/[projectId]/settings",
    },
  ],

  // User level navigation (when at /user/[userId])
  user: [
    {
      title: "Profile",
      href: "/user/[userId]",
    },
  ],
};

export function getNavigationItems(pathname: string): NavigationItem[] {
  const segments = pathname.split("/").filter(Boolean);

  // User level: /user/[userId]
  if (segments[0] === "user" && segments.length >= 2) {
    return navigationConfig.user;
  }

  // Site level: /[teamId]/[projectId]/... (but not billing, settings)
  if (
    segments.length >= 2 &&
    segments[1] !== "billing" &&
    segments[1] !== "settings"
  ) {
    return navigationConfig.site;
  }

  // Team level: /[teamId], /[teamId]/billing, or /[teamId]/settings
  if (segments.length >= 1 && segments[0] !== "user") {
    return navigationConfig.team;
  }

  return [];
}

export function replaceDynamicParams(
  items: NavigationItem[],
  teamId?: string,
  projectId?: string,
  userId?: string,
): NavigationItem[] {
  return items.map((item) => ({
    ...item,
    href: item.href
      .replace("[teamId]", teamId || "")
      .replace("[projectId]", projectId || "")
      .replace("[userId]", userId || ""),
  }));
}
