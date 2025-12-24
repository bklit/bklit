---
title: "Building an IP Blacklist for Analytics"
excerpt: "How I contributed an IP blacklist feature to Bklit, an open-source analytics platform, allowing site owners to exclude specific IPs and CIDR ranges from their data."
---

# Building an IP Blacklist for Analytics

One of the first things site owners ask for in an analytics platform is a way to exclude their own traffic. Nobody wants their dashboard visits inflating their pageview counts. I contributed an IP blacklist feature to [Bklit](https://bklit.com), an open-source analytics platform, that lets users block specific IP addresses or entire CIDR ranges from being tracked.

## The Goal

Allow project owners to:
- Add individual IP addresses to a blacklist
- Add CIDR ranges (like `10.0.0.0/8` or `192.168.1.0/24`) for blocking entire networks
- Easily add their own current IP with one click
- Have blocked visitors silently ignored (no error responses, just no data stored)

## The Solution

### Database Schema

First, I added a simple array field to the Project model:

```prisma
model Project {
  // ... existing fields
  blacklistedIps   String[]          @default([])
}
```

Arrays work well here since blacklists are typically small (a few IPs at most) and we always need the full list for checking.

### IP Validation and Checking

I created a utility file at `apps/dashboard/src/lib/ip-blacklist.ts` to handle validation and matching:

```typescript
import ipRangeCheck from "ip-range-check";

export function normalizeIp(ip: string | null): string | null {
  if (!ip) return null;

  // Strip IPv4-mapped IPv6 prefix (e.g., ::ffff:73.236.0.226 -> 73.236.0.226)
  if (ip.startsWith("::ffff:")) {
    return ip.slice(7);
  }

  return ip;
}

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
```

The `normalizeIp` function handles a quirk I discovered during testing—Node.js often represents IPv4 addresses in IPv4-mapped IPv6 format (`::ffff:192.168.1.1`). Users would see this confusing format when detecting their IP, so I strip the prefix for clean display and consistent matching.

The `ip-range-check` library handles both exact IP matches and CIDR range checking, which saved me from implementing subnet math myself.

### Silent Blocking in the Track Route

The key insight was that blocked visitors should get a normal 200 response. If we returned an error, it could break the tracking script or cause console errors on the site. Instead, we just silently don't store the data:

```typescript
// In apps/dashboard/src/app/api/track/route.ts

const clientIP = extractClientIP(request);

// Check IP blacklist - silently ignore blacklisted IPs
if (clientIP) {
  const project = await prisma.project.findUnique({
    where: { id: payload.projectId },
    select: { blacklistedIps: true },
  });

  if (project && isIpBlacklisted(clientIP, project.blacklistedIps)) {
    // Return 200 OK but don't store data (silent block)
    return createCorsResponse({ message: "Data received and stored" }, 200);
  }
}
```

This check happens early in the request lifecycle, before any expensive geolocation lookups or database writes.

### The "Add My IP" Button

I wanted to make it dead simple for users to exclude themselves. The settings component fetches the user's IP from a simple endpoint:

```typescript
// apps/dashboard/src/app/api/my-ip/route.ts
export async function GET(request: Request) {
  const clientIP = extractClientIP(request);
  const normalizedIP = normalizeIp(clientIP);

  return NextResponse.json({ ip: normalizedIP });
}
```

Then in the UI, a button auto-fills the input with their current IP. The component uses tRPC for the CRUD operations and validates input on the frontend with a regex that accepts both plain IPv4 and CIDR notation.

## Key Takeaways

**IPv4-mapped IPv6 is a thing.** If you're working with IPs in Node.js, be prepared to see `::ffff:` prefixes. Normalize them early to avoid confusion.

**Silent blocking is the right UX.** Don't break the site experience for blocked visitors—just don't track them.

**CIDR support is worth the extra effort.** Many users have dynamic IPs from their ISP, but the first two or three octets stay consistent. Letting them block `73.236.0.0/16` covers their whole ISP range without constant updates.

---

PR: [#144](https://github.com/bklit/bklit/pull/144)
