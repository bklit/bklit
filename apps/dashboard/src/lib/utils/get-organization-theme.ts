export type Theme = "spring" | "summer" | "autumn" | "winter";

export interface ThemeColors {
  gradient: string;
  bgColor: string;
  textColor: string;
}

const themeConfig: Record<Theme, ThemeColors> = {
  spring: {
    gradient: "bg-gradient-to-br from-lime-300 to-emerald-600",
    bgColor: "bg-lime-100",
    textColor: "text-emerald-700",
  },
  summer: {
    gradient: "bg-gradient-to-br from-yellow-300 to-lime-500",
    bgColor: "bg-yellow-100",
    textColor: "text-lime-700",
  },
  autumn: {
    gradient: "bg-gradient-to-br from-orange-300 to-rose-600",
    bgColor: "bg-orange-100",
    textColor: "text-rose-700",
  },
  winter: {
    gradient: "bg-gradient-to-br from-cyan-300 to-indigo-800",
    bgColor: "bg-cyan-100",
    textColor: "text-indigo-700",
  },
};

export function getOrganizationTheme(
  theme: string | null | undefined,
): ThemeColors {
  if (!theme || !(theme in themeConfig)) {
    // Default to spring theme
    return themeConfig.spring;
  }

  return themeConfig[theme as Theme];
}

export function getThemeGradient(theme: string | null | undefined): string {
  return getOrganizationTheme(theme).gradient;
}
