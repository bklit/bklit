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
      title: "Billing",
      href: "/[teamId]/billing",
    },
    {
      title: "Settings",
      href: "/[teamId]/settings",
    },
  ],

  // Site level navigation (when at /[teamId]/[siteId])
  site: [
    {
      title: "Overview",
      href: "/[teamId]/[siteId]",
    },
    {
      title: "Analytics",
      href: "/[teamId]/[siteId]/analytics",
    },
    {
      title: "Sessions",
      href: "/[teamId]/[siteId]/analytics/sessions",
    },
    {
      title: "Settings",
      href: "/[teamId]/[siteId]/settings",
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

  // Site level: /[teamId]/[siteId]/... (but not billing, settings)
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
  siteId?: string,
  userId?: string,
): NavigationItem[] {
  return items.map((item) => ({
    ...item,
    href: item.href
      .replace("[teamId]", teamId || "")
      .replace("[siteId]", siteId || "")
      .replace("[userId]", userId || ""),
  }));
}
