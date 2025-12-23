"use server";

import { ANALYTICS_UNLIMITED_QUERY_LIMIT } from "@bklit/analytics/constants";
import { AnalyticsService } from "@bklit/analytics/service";
import { prisma } from "@bklit/db/client";
import { unstable_cache as cache } from "next/cache";
import { z } from "zod";
import { cleanupStaleSessions } from "@/actions/session-actions";
import { endOfDay, parseClickHouseDate, startOfDay } from "@/lib/date-utils";

import { findCountryCoordinates } from "@/lib/maps/country-coordinates";
import type { BrowserStats, TopPageData } from "@/types/analytics";
import type {
  CityResult,
  CountryCodeResult,
  CountryStats,
  CountryWithCities,
  CountryWithVisits,
  SessionData,
  TopCountryData,
  TopCountryResult,
} from "@/types/geo";

const getTopCountriesSchema = z.object({
  projectId: z.string(),
  userId: z.string(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

export async function getTopCountries(
  params: z.infer<typeof getTopCountriesSchema>,
) {
  const validation = getTopCountriesSchema.safeParse(params);

  if (!validation.success) {
    throw new Error(validation.error.message);
  }

  const { projectId, startDate, endDate } = validation.data;

  const defaultStartDate = startDate
    ? startOfDay(startDate)
    : (() => {
        const date = startOfDay(new Date());
        date.setDate(date.getDate() - 30);
        return date;
      })();

  const normalizedEndDate = endDate ? endOfDay(endDate) : endOfDay(new Date());

  return await cache(
    async () => {
      const site = await prisma.project.findFirst({
        where: {
          id: projectId,
        },
      });

      if (!site) {
        throw new Error("Site not found or access denied");
      }

      const dateFilter = {
        timestamp: {
          gte: defaultStartDate,
          lte: normalizedEndDate,
        },
      };

      const analytics = new AnalyticsService();
      const topCountries = await analytics.getTopCountries({
        projectId,
        startDate: defaultStartDate,
        endDate: normalizedEndDate,
        limit: 5,
      });

      return topCountries.map(
        (c): TopCountryData => ({
          country: c.country || "",
          countryCode: c.country_code || "",
          views: c.visits || 0,
        }),
      );
    },
    [
      `${projectId}-top-countries`,
      defaultStartDate.toISOString(),
      normalizedEndDate.toISOString(),
    ],
    {
      revalidate: 300,
      tags: [`${projectId}-analytics`],
    },
  )();
}

const getAnalyticsStatsSchema = z.object({
  projectId: z.string(),
  userId: z.string(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

export async function getAnalyticsStats(
  params: z.input<typeof getAnalyticsStatsSchema>,
) {
  const validation = getAnalyticsStatsSchema.safeParse(params);

  if (!validation.success) {
    throw new Error(validation.error.message);
  }

  const { projectId, startDate, endDate } = validation.data;

  const defaultStartDate = startDate
    ? startOfDay(startDate)
    : (() => {
        const date = startOfDay(new Date());
        date.setDate(date.getDate() - 30);
        return date;
      })();

  const normalizedEndDate = endDate ? endOfDay(endDate) : endOfDay(new Date());

  return await cache(
    async () => {
      const site = await prisma.project.findFirst({
        where: {
          id: projectId,
        },
      });

      if (!site) {
        throw new Error("Site not found or access denied");
      }

      const dateFilter = {
        timestamp: {
          gte: defaultStartDate,
          lte: normalizedEndDate,
        },
      };

      const analytics = new AnalyticsService();
      const stats = await analytics.getStats({
        projectId,
        startDate: defaultStartDate,
        endDate: normalizedEndDate,
      });

      const totalViews = await analytics.countPageViews(projectId);
      const recentViews = stats.total_views;
      const uniquePages = stats.unique_pages;
      const uniqueVisits = stats.unique_visits;

      return {
        totalViews,
        recentViews,
        uniquePages: uniquePages || 0,
        uniqueVisits: uniqueVisits || 0,
      };
    },
    [
      `${projectId}-analytics-stats`,
      defaultStartDate.toISOString(),
      normalizedEndDate.toISOString(),
    ],
    {
      revalidate: 300,
      tags: [`${projectId}-analytics`],
    },
  )();
}

const getRecentPageViewsSchema = z.object({
  projectId: z.string(),
  userId: z.string(),
  limit: z.number().default(5),
});

export async function getRecentPageViews(
  params: z.input<typeof getRecentPageViewsSchema>,
) {
  const validation = getRecentPageViewsSchema.safeParse(params);

  if (!validation.success) {
    throw new Error(validation.error.message);
  }

  const { projectId, limit } = validation.data;

  return await cache(
    async () => {
      const site = await prisma.project.findFirst({
        where: {
          id: projectId,
        },
      });

      if (!site) {
        throw new Error("Site not found or access denied");
      }

      const analytics = new AnalyticsService();
      const recentViews = await analytics.getPageViews({
        projectId,
        limit,
      });

      return recentViews;
    },
    [`${projectId}-recent-page-views`],
    {
      revalidate: 60, // 1 minute
      tags: [`${projectId}-analytics`],
    },
  )();
}

const getVisitsByCountrySchema = z.object({
  projectId: z.string(),
  userId: z.string(),
});

export async function getVisitsByCountry(
  params: z.infer<typeof getVisitsByCountrySchema>,
) {
  const validation = getVisitsByCountrySchema.safeParse(params);

  if (!validation.success) {
    throw new Error(validation.error.message);
  }

  const { projectId } = validation.data;

  return await cache(
    async () => {
      const site = await prisma.project.findFirst({
        where: {
          id: projectId,
        },
      });

      if (!site) {
        throw new Error("Site not found or access denied");
      }

      // Get all countries with visits
      const analytics = new AnalyticsService();
      const topCountries = await analytics.getTopCountries({
        projectId,
        limit: 1000,
      });

      const pageviews = await analytics.getPageViews({
        projectId,
        limit: ANALYTICS_UNLIMITED_QUERY_LIMIT,
      });

      const countriesWithVisits = topCountries.map((c) => {
        const samplePageview = pageviews.find((p) => p.country === c.country);
        return {
          country: c.country,
          countryCode: c.country_code,
          lat: samplePageview?.lat || null,
          lon: samplePageview?.lon || null,
          _count: { country: c.visits },
        };
      });

      // Get city breakdown for each country
      const countriesWithCities = await Promise.all(
        countriesWithVisits.map(
          async (country: CountryWithVisits): Promise<CountryWithCities> => {
            const countryPageviews = pageviews.filter(
              (p) => p.country === country.country && p.city,
            );
            const cityCounts = countryPageviews.reduce(
              (acc, p) => {
                if (p.city) {
                  acc[p.city] = (acc[p.city] || 0) + 1;
                }
                return acc;
              },
              {} as Record<string, number>,
            );
            const cities = Object.entries(cityCounts)
              .map(([city, count]) => ({
                city,
                _count: { city: count },
              }))
              .sort((a, b) => b._count.city - a._count.city);

            return {
              country: country.country || "",
              countryCode: country.countryCode || "",
              totalVisits: country._count.country,
              coordinates:
                country.lat && country.lon
                  ? ([country.lon, country.lat] as [number, number])
                  : null,
              cities: cities.map((city: CityResult) => ({
                name: city.city || "",
                visits: city._count.city,
              })),
            };
          },
        ),
      );

      return countriesWithCities.filter(
        (country: CountryWithCities) => country.coordinates !== null,
      );
    },
    [`${projectId}-visits-by-country`],
    {
      revalidate: 300, // 5 minutes
      tags: [`${projectId}-analytics`],
    },
  )();
}

const getCountryVisitStatsSchema = z.object({
  projectId: z.string(),
  userId: z.string(),
});

export async function getCountryVisitStats(
  params: z.infer<typeof getCountryVisitStatsSchema>,
) {
  const validation = getCountryVisitStatsSchema.safeParse(params);

  if (!validation.success) {
    throw new Error(validation.error.message);
  }

  const { projectId } = validation.data;

  return await cache(
    async () => {
      const site = await prisma.project.findFirst({
        where: {
          id: projectId,
        },
      });

      if (!site) {
        throw new Error("Site not found or access denied");
      }

      // Get all countries with visits, grouped by country
      const analytics = new AnalyticsService();
      const topCountries = await analytics.getTopCountries({
        projectId,
        limit: 1000,
      });

      const countriesWithVisits = topCountries.map((c) => ({
        country: c.country,
        countryCode: c.country_code,
        _count: { country: c.visits },
      }));

      // Get detailed stats for each country
      const countriesWithStats = await Promise.all(
        countriesWithVisits.map(
          async (country: TopCountryResult): Promise<CountryStats> => {
            const countryCode = country.countryCode || "";
            const coordinates = findCountryCoordinates(countryCode);

            // Skip countries without coordinates
            if (!coordinates) {
              return null;
            }

            // Get mobile vs desktop breakdown
            const countryPageviews = await analytics.getPageViews({
              projectId,
              limit: ANALYTICS_UNLIMITED_QUERY_LIMIT,
            });
            const mobileVisits = countryPageviews.filter(
              (p) => p.country === country.country && p.mobile === true,
            ).length;

            const desktopVisits = countryPageviews.filter(
              (p) => p.country === country.country && p.mobile === false,
            ).length;

            const uniqueVisits = new Set(
              countryPageviews
                .filter((p) => p.country === country.country && p.ip)
                .map((p) => p.ip),
            ).size;

            return {
              country: country.country || "",
              countryCode,
              totalVisits: Number(country._count.country) || 0,
              mobileVisits: Number(mobileVisits) || 0,
              desktopVisits: Number(desktopVisits) || 0,
              uniqueVisits: uniqueVisits || 0,
              coordinates: coordinates
                ? ([coordinates.longitude, coordinates.latitude] as [
                    number,
                    number,
                  ])
                : null,
            };
          },
        ),
      );

      // Filter out countries without coordinates and sort by visits
      const result = countriesWithStats
        .filter(
          (country: CountryStats) =>
            country !== null && country.coordinates !== null,
        )
        .sort(
          (a: CountryStats, b: CountryStats) => b.totalVisits - a.totalVisits,
        );

      return result;
    },
    [`${projectId}-country-visit-stats`],
    {
      revalidate: 300, // 5 minutes
      tags: [`${projectId}-analytics`],
    },
  )();
}

const getCountryVisitorStatsSchema = z.object({
  projectId: z.string(),
});

export async function getCountryVisitorStats(
  params: z.infer<typeof getCountryVisitorStatsSchema>,
) {
  const validation = getCountryVisitorStatsSchema.safeParse(params);

  if (!validation.success) {
    throw new Error(validation.error.message);
  }

  const { projectId } = validation.data;

  return await cache(
    async () => {
      const site = await prisma.project.findFirst({
        where: {
          id: projectId,
        },
      });

      if (!site) {
        throw new Error("Site not found or access denied");
      }

      const analytics = new AnalyticsService();
      const sessions = await analytics.getSessions({
        projectId,
        limit: ANALYTICS_UNLIMITED_QUERY_LIMIT,
      });

      const pageviews = await analytics.getPageViews({
        projectId,
        limit: ANALYTICS_UNLIMITED_QUERY_LIMIT,
      });

      const sessionsByCountry = sessions.reduce(
        (acc, s) => {
          if (s.country) {
            acc[s.country] = (acc[s.country] || 0) + 1;
          }
          return acc;
        },
        {} as Record<string, number>,
      );

      const countriesWithStats = await Promise.all(
        Object.entries(sessionsByCountry).map(async ([country, count]) => {
          const samplePageView = pageviews.find(
            (p) => p.country === country && p.country_code,
          );

          const countryCode = samplePageView?.country_code;
          if (!countryCode) {
            return null;
          }

          const coordinates = findCountryCoordinates(countryCode);
          if (!coordinates) {
            return null;
          }

          const countrySessions = sessions.filter((s) => s.country === country);
          const pageviewsBySession = pageviews.reduce(
            (acc, pv) => {
              if (pv.session_id) {
                if (!acc[pv.session_id]) {
                  acc[pv.session_id] = [];
                }
                acc[pv.session_id].push(pv);
              }
              return acc;
            },
            {} as Record<string, typeof pageviews>,
          );

          const mobileSessions = countrySessions.filter((s) => {
            const sessionPageviews = pageviewsBySession[s.session_id] || [];
            return (
              sessionPageviews.some((p) => p.mobile) ||
              (s.user_agent && /Mobile|Android|iPhone|iPad/.test(s.user_agent))
            );
          }).length;

          const desktopSessions = countrySessions.filter((s) => {
            const sessionPageviews = pageviewsBySession[s.session_id] || [];
            return (
              sessionPageviews.some((p) => p.mobile === false) ||
              (s.user_agent && !/Mobile|Android|iPhone|iPad/.test(s.user_agent))
            );
          }).length;

          return {
            country,
            countryCode,
            totalVisits: count || 0,
            mobileVisits: mobileSessions || 0,
            desktopVisits: desktopSessions || 0,
            uniqueVisits: count || 0,
            coordinates: coordinates
              ? ([coordinates.longitude, coordinates.latitude] as [
                  number,
                  number,
                ])
              : null,
          };
        }),
      );

      // Filter out countries without coordinates and sort by visits
      const result = countriesWithStats
        .filter(
          (country: CountryStats | null) =>
            country !== null && country.coordinates !== null,
        )
        .sort(
          (a: CountryStats, b: CountryStats) => b.totalVisits - a.totalVisits,
        );

      return result;
    },
    [`${projectId}-country-visitor-stats`],
    {
      revalidate: 300, // 5 minutes
      tags: [`${projectId}-analytics`],
    },
  )();
}

export async function debugCountryCodes(
  params: z.infer<typeof getCountryVisitStatsSchema>,
) {
  const validation = getCountryVisitStatsSchema.safeParse(params);

  if (!validation.success) {
    throw new Error(validation.error.message);
  }

  const { projectId } = validation.data;

  const site = await prisma.project.findFirst({
    where: {
      id: projectId,
    },
  });

  if (!site) {
    throw new Error("Site not found or access denied");
  }

  const analytics = new AnalyticsService();
  const topCountries = await analytics.getTopCountries({
    projectId,
    limit: 1000,
  });

  const uniqueCountryCodes = topCountries.map((c) => ({
    country: c.country,
    countryCode: c.country_code,
    _count: { countryCode: c.visits },
  }));

  console.log(
    "Unique country codes in database:",
    uniqueCountryCodes.map((c: CountryCodeResult) => ({
      country: c.country,
      countryCode: c.countryCode,
      count: c._count.countryCode,
    })),
  );

  return uniqueCountryCodes;
}

const getUniqueVisitorsByCountrySchema = z.object({
  projectId: z.string(),
});

export async function getUniqueVisitorsByCountry(
  params: z.infer<typeof getUniqueVisitorsByCountrySchema>,
) {
  const validation = getUniqueVisitorsByCountrySchema.safeParse(params);

  if (!validation.success) {
    throw new Error(validation.error.message);
  }

  const { projectId } = validation.data;

  return await cache(
    async () => {
      const site = await prisma.project.findFirst({
        where: {
          id: projectId,
        },
      });

      if (!site) {
        throw new Error("Site not found or access denied");
      }

      const analytics = new AnalyticsService();
      const sessions = await analytics.getSessions({
        projectId,
        limit: ANALYTICS_UNLIMITED_QUERY_LIMIT,
      });

      const pageviews = await analytics.getPageViews({
        projectId,
        limit: ANALYTICS_UNLIMITED_QUERY_LIMIT,
      });

      const sessionsByCountry = sessions.reduce(
        (acc, s) => {
          if (s.country) {
            acc[s.country] = (acc[s.country] || 0) + 1;
          }
          return acc;
        },
        {} as Record<string, number>,
      );

      const visitorsData = await Promise.all(
        Object.entries(sessionsByCountry).map(async ([country, count]) => {
          const samplePageView = pageviews.find(
            (p) => p.country === country && p.country_code,
          );

          const countryCode = samplePageView?.country_code;
          if (!countryCode) {
            return null;
          }

          const coordinates = findCountryCoordinates(countryCode);
          if (!coordinates || !coordinates.alpha3Code) {
            return null;
          }

          const totalSessions = count;
          const countrySessions = sessions.filter((s) => s.country === country);
          const bouncedSessions = countrySessions.filter(
            (s) => s.did_bounce,
          ).length;

          const bounceRate =
            totalSessions > 0 ? (bouncedSessions / totalSessions) * 100 : 0;

          const mobileSessions = countrySessions.filter((s) => {
            const sessionPageviews = pageviews.filter(
              (p) => p.session_id === s.session_id,
            );
            return (
              sessionPageviews.some((p) => p.mobile) ||
              (s.user_agent && /Mobile|Android|iPhone|iPad/.test(s.user_agent))
            );
          }).length;
          const desktopSessions = totalSessions - mobileSessions;

          const pageviewsForCountry = pageviews.filter(
            (p) => p.country === country,
          );
          const uniqueVisitors = new Set(
            pageviewsForCountry.filter((p) => p.ip).map((p) => p.ip),
          ).size;

          return {
            country,
            countryCode,
            alpha3Code: coordinates.alpha3Code,
            totalSessions,
            bounceRate: Math.round(bounceRate * 100) / 100,
            mobileSessions,
            desktopSessions,
            uniqueVisitors,
            coordinates: [coordinates.longitude, coordinates.latitude] as [
              number,
              number,
            ],
          };
        }),
      );

      return visitorsData.filter((v) => v !== null);
    },
    [`${projectId}-unique-visitors-by-country`],
    {
      revalidate: 300, // 5 minutes
      tags: [`${projectId}-analytics`],
    },
  )();
}

const getMobileDesktopStatsSchema = z.object({
  projectId: z.string(),
  userId: z.string(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

export async function getMobileDesktopStats(
  params: z.infer<typeof getMobileDesktopStatsSchema>,
) {
  const validation = getMobileDesktopStatsSchema.safeParse(params);

  if (!validation.success) {
    throw new Error(validation.error.message);
  }

  const { projectId, startDate, endDate } = validation.data;

  const defaultStartDate = startDate
    ? startOfDay(startDate)
    : (() => {
        const date = startOfDay(new Date());
        date.setDate(date.getDate() - 30);
        return date;
      })();

  const normalizedEndDate = endDate ? endOfDay(endDate) : endOfDay(new Date());

  return await cache(
    async () => {
      const site = await prisma.project.findFirst({
        where: {
          id: projectId,
        },
      });

      if (!site) {
        throw new Error("Site not found or access denied");
      }

      const dateFilter = {
        timestamp: {
          gte: defaultStartDate,
          lte: normalizedEndDate,
        },
      };

      const analytics = new AnalyticsService();
      const pageviews = await analytics.getPageViews({
        projectId,
        startDate: defaultStartDate,
        endDate: normalizedEndDate,
        limit: ANALYTICS_UNLIMITED_QUERY_LIMIT,
      });

      const uniqueMobileVisits = new Set(
        pageviews
          .filter((p) => p.mobile === true && p.ip)
          .map((p) => `${p.session_id || ""}-${p.ip}`),
      ).size;

      const uniqueDesktopVisits = new Set(
        pageviews
          .filter((p) => p.mobile === false && p.ip)
          .map((p) => `${p.session_id || ""}-${p.ip}`),
      ).size;

      return {
        mobile: uniqueMobileVisits,
        desktop: uniqueDesktopVisits,
      };
    },
    [
      `${projectId}-mobile-desktop-stats`,
      defaultStartDate.toISOString(),
      normalizedEndDate.toISOString(),
    ],
    {
      revalidate: 300,
      tags: [`${projectId}-analytics`],
    },
  )();
}

const getTopPagesSchema = z.object({
  projectId: z.string(),
  userId: z.string(),
  limit: z.number().default(5),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

export async function getTopPages(params: z.input<typeof getTopPagesSchema>) {
  const validation = getTopPagesSchema.safeParse(params);

  if (!validation.success) {
    throw new Error(validation.error.message);
  }

  const { projectId, limit, startDate, endDate } = validation.data;

  // Calculate dates outside cache function for cache key
  const defaultStartDate = startDate
    ? startOfDay(startDate)
    : (() => {
        const date = startOfDay(new Date());
        date.setDate(date.getDate() - 30);
        return date;
      })();

  const normalizedEndDate = endDate ? endOfDay(endDate) : endOfDay(new Date());

  return await cache(
    async () => {
      const site = await prisma.project.findFirst({
        where: {
          id: projectId,
        },
      });

      if (!site) {
        throw new Error("Site not found or access denied");
      }

      const dateFilter = {
        timestamp: {
          gte: defaultStartDate,
          lte: normalizedEndDate,
        },
      };

      const analytics = new AnalyticsService();
      const events = await analytics.getPageViews({
        projectId,
        startDate: defaultStartDate,
        endDate: normalizedEndDate,
        limit: ANALYTICS_UNLIMITED_QUERY_LIMIT,
      });

      const pathCounts: Record<string, number> = {};
      for (const event of events) {
        let path = event.url;
        try {
          path = new URL(event.url).pathname;
        } catch {}
        pathCounts[path] = (pathCounts[path] || 0) + 1;
      }

      // Sort and take top N
      const topPages = Object.entries(pathCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([path, count]): TopPageData => ({ path, count }));

      return topPages;
    },
    [
      `${projectId}-top-pages`,
      defaultStartDate.toISOString(),
      normalizedEndDate.toISOString(),
    ],
    {
      revalidate: 60,
      tags: [`${projectId}-analytics`],
    },
  )();
}

const getBrowserStatsSchema = z.object({
  projectId: z.string(),
  userId: z.string(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

export async function getBrowserStats(
  params: z.infer<typeof getBrowserStatsSchema>,
) {
  const validation = getBrowserStatsSchema.safeParse(params);

  if (!validation.success) {
    throw new Error(validation.error.message);
  }

  const { projectId, startDate, endDate } = validation.data;

  const defaultStartDate = startDate
    ? startOfDay(startDate)
    : (() => {
        const date = startOfDay(new Date());
        date.setDate(date.getDate() - 30);
        return date;
      })();

  const normalizedEndDate = endDate ? endOfDay(endDate) : endOfDay(new Date());

  return await cache(
    async () => {
      const site = await prisma.project.findFirst({
        where: {
          id: projectId,
        },
      });

      if (!site) {
        throw new Error("Site not found or access denied");
      }

      const dateFilter = {
        timestamp: {
          gte: defaultStartDate,
          lte: normalizedEndDate,
        },
      };

      const analytics = new AnalyticsService();
      const pageViews = await analytics.getPageViews({
        projectId,
        startDate: defaultStartDate,
        endDate: normalizedEndDate,
        limit: ANALYTICS_UNLIMITED_QUERY_LIMIT,
      });

      // Parse user agents to extract browser information
      const browserStats: Record<string, number> = {};

      pageViews.forEach((view) => {
        const userAgent = (view.user_agent || "").toLowerCase();
        let browser = "Unknown";

        // Improved browser detection logic (order matters - check more specific first)
        if (userAgent.includes("edg/") || userAgent.includes("edgios/")) {
          browser = "Edge";
        } else if (userAgent.includes("opr/") || userAgent.includes("opera/")) {
          browser = "Opera";
        } else if (
          userAgent.includes("chrome/") &&
          !userAgent.includes("edg/")
        ) {
          browser = "Chrome";
        } else if (
          userAgent.includes("firefox/") ||
          userAgent.includes("fxios/")
        ) {
          browser = "Firefox";
        } else if (
          userAgent.includes("safari/") &&
          !userAgent.includes("chrome/") &&
          !userAgent.includes("crios/")
        ) {
          browser = "Safari";
        } else if (
          userAgent.includes("msie") ||
          userAgent.includes("trident/")
        ) {
          browser = "Internet Explorer";
        } else if (userAgent.includes("samsungbrowser/")) {
          browser = "Samsung Internet";
        } else if (userAgent.includes("brave/")) {
          browser = "Brave";
        } else if (userAgent.length > 0) {
          // If we have a user agent but couldn't identify it, try to extract a hint
          const uaMatch = userAgent.match(/([a-z]+)\/(\d+)/);
          if (uaMatch && uaMatch[1]) {
            browser = uaMatch[1].charAt(0).toUpperCase() + uaMatch[1].slice(1);
          }
        }

        browserStats[browser] = (browserStats[browser] || 0) + 1;
      });

      // Convert to array format for easier consumption
      const browserData = Object.entries(browserStats)
        .map(([browser, count]): BrowserStats => ({ browser, count }))
        .sort((a, b) => b.count - a.count);

      return browserData;
    },
    [
      `${projectId}-browser-stats`,
      defaultStartDate.toISOString(),
      normalizedEndDate.toISOString(),
    ],
    {
      revalidate: 300,
      tags: [`${projectId}-analytics`],
    },
  )();
}

const getSessionAnalyticsSchema = z.object({
  projectId: z.string(),
  userId: z.string(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

export async function getSessionAnalytics(
  params: z.input<typeof getSessionAnalyticsSchema>,
) {
  const validation = getSessionAnalyticsSchema.safeParse(params);

  if (!validation.success) {
    throw new Error(validation.error.message);
  }

  const { projectId, startDate, endDate } = validation.data;

  const defaultStartDate = startDate
    ? startOfDay(startDate)
    : (() => {
        const date = startOfDay(new Date());
        date.setDate(date.getDate() - 30);
        return date;
      })();

  const normalizedEndDate = endDate ? endOfDay(endDate) : endOfDay(new Date());

  return await cache(
    async () => {
      const site = await prisma.project.findFirst({
        where: {
          id: projectId,
        },
      });

      if (!site) {
        throw new Error("Site not found or access denied");
      }

      const dateFilter = {
        startedAt: {
          gte: defaultStartDate,
          lte: normalizedEndDate,
        },
      };

      const analytics = new AnalyticsService();
      const sessions = await analytics.getSessions({
        projectId,
        startDate: defaultStartDate,
        endDate: normalizedEndDate,
        limit: ANALYTICS_UNLIMITED_QUERY_LIMIT,
      });

      const pageviews = await analytics.getPageViews({
        projectId,
        startDate: defaultStartDate,
        endDate: normalizedEndDate,
        limit: ANALYTICS_UNLIMITED_QUERY_LIMIT,
      });

      const pageviewsBySession = pageviews.reduce(
        (acc, pv) => {
          if (pv.session_id) {
            if (!acc[pv.session_id]) {
              acc[pv.session_id] = [];
            }
            acc[pv.session_id].push({
              id: pv.id,
              url: pv.url,
              timestamp: parseClickHouseDate(pv.timestamp),
            });
          }
          return acc;
        },
        {} as Record<
          string,
          Array<{ id: string; url: string; timestamp: Date }>
        >,
      );

      const sessionsWithPageviews = sessions.map((s) => ({
        ...s,
        pageViewEvents: (pageviewsBySession[s.session_id] || []).sort(
          (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
        ),
        didBounce: s.did_bounce,
        duration: s.duration,
        startedAt: parseClickHouseDate(s.started_at),
        endedAt: s.ended_at ? parseClickHouseDate(s.ended_at) : null,
      }));

      const totalSessions = sessionsWithPageviews.length;
      const bouncedSessions = sessionsWithPageviews.filter(
        (s) => s.didBounce,
      ).length;
      const bounceRate =
        totalSessions > 0 ? (bouncedSessions / totalSessions) * 100 : 0;

      const avgSessionDuration =
        sessionsWithPageviews.length > 0
          ? sessionsWithPageviews.reduce(
              (sum, s) => sum + (s.duration || 0),
              0,
            ) / sessionsWithPageviews.length
          : 0;

      const avgPageViews =
        sessionsWithPageviews.length > 0
          ? sessionsWithPageviews.reduce(
              (sum, s) => sum + s.pageViewEvents.length,
              0,
            ) / sessionsWithPageviews.length
          : 0;

      return {
        totalSessions,
        bouncedSessions,
        bounceRate: Math.round(bounceRate * 100) / 100,
        avgSessionDuration: Math.round(avgSessionDuration),
        avgPageViews: Math.round(avgPageViews * 100) / 100,
        recentSessions: sessions.slice(0, 5),
      };
    },
    [
      `${projectId}-session-analytics`,
      startDate?.toISOString(),
      endDate?.toISOString(),
    ],
    {
      revalidate: 300,
      tags: [`${projectId}-analytics`],
    },
  )();
}

const getTopReferrersSchema = z.object({
  projectId: z.string(),
  userId: z.string(),
  limit: z.number().default(5),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

export async function getTopReferrers(
  params: z.input<typeof getTopReferrersSchema>,
) {
  const validation = getTopReferrersSchema.safeParse(params);

  if (!validation.success) {
    throw new Error(validation.error.message);
  }

  const { projectId, limit, startDate, endDate } = validation.data;

  const defaultStartDate = startDate
    ? startOfDay(startDate)
    : (() => {
        const date = startOfDay(new Date());
        date.setDate(date.getDate() - 30);
        return date;
      })();

  const normalizedEndDate = endDate ? endOfDay(endDate) : endOfDay(new Date());

  return await cache(
    async () => {
      const site = await prisma.project.findFirst({
        where: {
          id: projectId,
        },
      });

      if (!site) {
        throw new Error("Site not found or access denied");
      }

      const analytics = new AnalyticsService();
      const pageViews = await analytics.getPageViews({
        projectId,
        startDate: defaultStartDate,
        endDate: normalizedEndDate,
        limit: ANALYTICS_UNLIMITED_QUERY_LIMIT,
      });

      const referrerCounts: Record<string, number> = {};

      for (const view of pageViews) {
        let referrer = "Direct / None";

        if (view.referrer) {
          try {
            const url = new URL(view.referrer);
            referrer = url.hostname.replace(/^www\./, "");
          } catch {
            referrer = view.referrer;
          }
        }

        referrerCounts[referrer] = (referrerCounts[referrer] || 0) + 1;
      }

      const topReferrers = Object.entries(referrerCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([referrer, count]) => ({ referrer, count }));

      return topReferrers;
    },
    [
      `${projectId}-top-referrers`,
      defaultStartDate.toISOString(),
      normalizedEndDate.toISOString(),
    ],
    {
      revalidate: 300,
      tags: [`${projectId}-analytics`],
    },
  )();
}

const getLiveUsersSchema = z.object({
  projectId: z.string(),
  userId: z.string(),
});

const getConversionsSchema = z.object({
  projectId: z.string(),
  userId: z.string(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

export async function getConversions(
  params: z.infer<typeof getConversionsSchema>,
) {
  const validation = getConversionsSchema.safeParse(params);

  if (!validation.success) {
    throw new Error(validation.error.message);
  }

  const { projectId, startDate, endDate } = validation.data;

  const defaultStartDate = startDate
    ? startOfDay(startDate)
    : (() => {
        const date = startOfDay(new Date());
        date.setDate(date.getDate() - 30);
        return date;
      })();

  const normalizedEndDate = endDate ? endOfDay(endDate) : endOfDay(new Date());

  return await cache(
    async () => {
      const site = await prisma.project.findFirst({
        where: {
          id: projectId,
        },
      });

      if (!site) {
        throw new Error("Site not found or access denied");
      }

      const dateFilter = {
        timestamp: {
          gte: defaultStartDate,
          lte: normalizedEndDate,
        },
      };

      const analytics = new AnalyticsService();
      const trackedEvents = await analytics.getTrackedEvents({
        projectId,
        startDate: defaultStartDate,
        endDate: normalizedEndDate,
      });

      const uniqueSessionIds = new Set<string>();
      for (const event of trackedEvents) {
        if (event.session_id) {
          uniqueSessionIds.add(event.session_id);
        }
      }

      return uniqueSessionIds.size;
    },
    [
      `${projectId}-conversions-${defaultStartDate.toISOString()}-${normalizedEndDate.toISOString()}`,
    ],
    {
      revalidate: 60,
      tags: [`${projectId}-analytics`],
    },
  )();
}

export async function getLiveUsers(params: z.infer<typeof getLiveUsersSchema>) {
  const validation = getLiveUsersSchema.safeParse(params);

  if (!validation.success) {
    throw new Error(validation.error.message);
  }

  const { projectId } = validation.data;

  return await cache(
    async () => {
      const site = await prisma.project.findFirst({
        where: {
          id: projectId,
        },
      });

      if (!site) {
        throw new Error("Site not found or access denied");
      }

      await cleanupStaleSessions();

      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

      console.log("📊 LIVE USERS: Counting active sessions", {
        projectId,
        thirtyMinutesAgo: thirtyMinutesAgo.toISOString(),
      });

      const analytics = new AnalyticsService();
      const liveUsers = await analytics.getLiveUsers(projectId);

      console.log("📊 LIVE USERS: Found active sessions", {
        projectId,
        liveUsers,
      });

      return liveUsers;
    },
    [`${projectId}-live-users`],
    {
      revalidate: 30,
      tags: [`${projectId}-analytics`],
    },
  )();
}
