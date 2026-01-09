import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Regex for URL protocol removal
const PROTOCOL_REGEX = /^https?:\/\//;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function cleanUrl(url: string, domain?: string | null): string {
  let cleanURL = "/";
  try {
    const urlObj = new URL(url);
    cleanURL = urlObj.pathname || "/";
  } catch {
    if (domain) {
      const cleanDomain = domain.replace(PROTOCOL_REGEX, "");
      cleanURL =
        url.replace(cleanDomain, "").replace(PROTOCOL_REGEX, "") || "/";
      if (!cleanURL.startsWith("/")) {
        cleanURL = `/${cleanURL}`;
      }
    }
  }
  return cleanURL;
}
