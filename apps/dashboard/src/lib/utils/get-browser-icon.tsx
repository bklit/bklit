import { BrowserIcon } from "@/components/icons/browser";
import { ChromeIcon } from "@/components/icons/chrome";
import { EdgeIcon } from "@/components/icons/edge";
import { FirefoxIcon } from "@/components/icons/firefox";
import { SafariIcon } from "@/components/icons/safari";

export function getBrowserIcon(browser: string, size = 16) {
  switch (browser.toLowerCase()) {
    case "chrome":
      return <ChromeIcon size={size} />;
    case "firefox":
      return <FirefoxIcon size={size} />;
    case "safari":
      return <SafariIcon size={size} />;
    case "edge":
      return <EdgeIcon size={size} />;
    default:
      return <BrowserIcon size={size} />;
  }
}
