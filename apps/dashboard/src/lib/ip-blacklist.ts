import ipRangeCheck from "ip-range-check";

/**
 * Normalize an IP address by stripping IPv4-mapped IPv6 prefix (::ffff:)
 */
export function normalizeIp(ip: string | null): string | null {
  if (!ip) return null;

  // Strip IPv4-mapped IPv6 prefix (e.g., ::ffff:73.236.0.226 -> 73.236.0.226)
  if (ip.startsWith("::ffff:")) {
    return ip.slice(7);
  }

  return ip;
}

/**
 * Validates if a string is a valid IPv4 address or CIDR notation
 */
export function isValidIpOrCidr(input: string): boolean {
  const trimmed = input.trim();

  // IPv4 address pattern
  const ipv4 =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

  // CIDR notation pattern (IPv4 with /0-32 suffix)
  const cidrV4 =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(?:3[0-2]|[12]?[0-9])$/;

  return ipv4.test(trimmed) || cidrV4.test(trimmed);
}

/**
 * Check if an IP is blacklisted against a list of IPs/CIDR ranges
 */
export function isIpBlacklisted(
  clientIp: string | null,
  blacklist: string[],
): boolean {
  const normalizedIp = normalizeIp(clientIp);

  if (!normalizedIp || blacklist.length === 0) {
    return false;
  }

  return ipRangeCheck(normalizedIp, blacklist);
}
