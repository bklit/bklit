import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

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
      const cleanDomain = domain.replace(/^https?:\/\//, "");
      cleanURL =
        url.replace(cleanDomain, "").replace(/^https?:\/\//, "") || "/";
      if (!cleanURL.startsWith("/")) {
        cleanURL = `/${cleanURL}`;
      }
    }
  }
  return cleanURL;
}
