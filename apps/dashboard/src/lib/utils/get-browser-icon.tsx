import { BrowserIcon } from "@/components/icons/browser";
import { ChromeIcon } from "@/components/icons/chrome";
import { EdgeIcon } from "@/components/icons/edge";
import { FirefoxIcon } from "@/components/icons/firefox";
import { SafariIcon } from "@/components/icons/safari";

interface BrowserConfig {
  name: string;
  pattern: string;
  icon: React.ComponentType<{ size?: number }>;
}

const BROWSER_CONFIG: Record<string, BrowserConfig> = {
  chrome: {
    name: "Chrome",
    pattern: "Chrome",
    icon: ChromeIcon,
  },
  firefox: {
    name: "Firefox",
    pattern: "Firefox",
    icon: FirefoxIcon,
  },
  safari: {
    name: "Safari",
    pattern: "Safari",
    icon: SafariIcon,
  },
  edge: {
    name: "Edge",
    pattern: "Edge",
    icon: EdgeIcon,
  },
};

export function getBrowserIcon(browser: string, size = 16) {
  const browserKey = browser.toLowerCase();
  const config = BROWSER_CONFIG[browserKey];

  if (config) {
    const Icon = config.icon;
    return <Icon size={size} />;
  }

  return <BrowserIcon size={size} />;
}

export function getBrowserFromUserAgent(userAgent: string | null): string {
  if (!userAgent) return "Unknown";

  for (const config of Object.values(BROWSER_CONFIG)) {
    if (userAgent.includes(config.pattern)) return config.name;
  }

  return "Other";
}
