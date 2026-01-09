// Regex for mobile device detection
const MOBILE_DEVICE_REGEX =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i;

export function isMobileDevice(userAgent: string | null | undefined): boolean {
  if (!userAgent) {
    return false;
  }

  return MOBILE_DEVICE_REGEX.test(userAgent);
}

export function detectDevice(
  userAgent: string | null | undefined
): "mobile" | "desktop" | "tablet" | "unknown" {
  if (!userAgent) {
    return "unknown";
  }

  const ua = userAgent.toLowerCase();

  // Check for tablets first (more specific)
  if (
    ua.includes("ipad") ||
    (ua.includes("android") && !ua.includes("mobile"))
  ) {
    return "tablet";
  }

  // Check for mobile devices
  if (
    ua.includes("iphone") ||
    ua.includes("ipod") ||
    (ua.includes("android") && ua.includes("mobile")) ||
    ua.includes("webos") ||
    ua.includes("blackberry") ||
    ua.includes("windows phone") ||
    ua.includes("iemobile") ||
    ua.includes("opera mini")
  ) {
    return "mobile";
  }

  // Everything else is desktop
  return "desktop";
}
