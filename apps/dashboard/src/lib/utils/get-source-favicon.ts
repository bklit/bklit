// Regex patterns for domain processing
const PROTOCOL_REGEX = /^https?:\/\//;
const DOMAIN_VALIDATION_REGEX =
  /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export function getSourceFavicon(
  source: string,
  projectDomain?: string | null
): string {
  const specialSources = new Set(["direct", "(direct)"]);

  const normalizedSource = source.trim().toLowerCase();

  if (specialSources.has(normalizedSource)) {
    if (projectDomain) {
      try {
        const url = new URL(projectDomain);
        const domain = url.hostname;
        return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
      } catch {
        const domain = projectDomain
          .replace(PROTOCOL_REGEX, "")
          .split("/")[0]
          ?.split(":")[0];
        if (domain) {
          return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
        }
      }
    }
    return "/globe.svg";
  }

  let domain = normalizedSource.replace(PROTOCOL_REGEX, "");

  domain = domain.split("/")[0]?.split("?")[0] || domain;

  domain = domain.split(":")[0] || domain;

  if (domain === "localhost") {
    if (projectDomain) {
      try {
        const url = new URL(projectDomain);
        const projectDomainName = url.hostname;
        return `https://icons.duckduckgo.com/ip3/${projectDomainName}.ico`;
      } catch {
        const projectDomainName = projectDomain
          .replace(PROTOCOL_REGEX, "")
          .split("/")[0]
          ?.split(":")[0];
        if (projectDomainName) {
          return `https://icons.duckduckgo.com/ip3/${projectDomainName}.ico`;
        }
      }
    }
    return "/globe.svg";
  }

  if (
    domain === "twitter.com" ||
    domain === "t.co" ||
    domain === "www.twitter.com"
  ) {
    domain = "x.com";
  }

  if (!domain || domain.length === 0) {
    return "/globe.svg";
  }

  if (!DOMAIN_VALIDATION_REGEX.test(domain)) {
    return "/globe.svg";
  }

  return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
}
