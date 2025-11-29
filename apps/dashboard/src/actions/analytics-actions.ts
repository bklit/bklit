"use server";

import { prisma } from "@bklit/db/client";
import { unstable_cache as cache } from "next/cache";
import { z } from "zod";
import { cleanupStaleSessions } from "@/actions/session-actions";
import { endOfDay, startOfDay } from "@/lib/date-utils";
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

      const topCountries = await prisma.pageViewEvent.groupBy({
        by: ["country", "countryCode"],
        where: {
          projectId,
          country: { not: null },
          countryCode: { not: null },
          ...dateFilter,
        },
        _count: {
          country: true,
        },
        orderBy: {
          _count: {
            country: "desc",
          },
        },
        take: 5,
      });

      return topCountries.map(
        (c: TopCountryResult): TopCountryData => ({
          country: c.country || "",
          countryCode: c.countryCode || "",
          views: Number(c._count.country) || 0,
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

      const [totalViews, recentViews, uniquePages, uniqueVisits] =
        await Promise.all([
          prisma.pageViewEvent.count({
            where: { projectId },
          }),
          prisma.pageViewEvent.count({
            where: {
              projectId,
              ...dateFilter,
            },
          }),
          prisma.pageViewEvent.findMany({
            where: { projectId, ...dateFilter },
            distinct: ["url"],
            select: { url: true },
          }),
          prisma.pageViewEvent.findMany({
            where: {
              projectId,
              ip: { not: null },
              ...dateFilter,
            },
            distinct: ["ip"],
            select: { ip: true },
          }),
        ]);

      return {
        totalViews,
        recentViews,
        uniquePages: uniquePages.length,
        uniqueVisits: uniqueVisits.length,
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

      const recentViews = await prisma.pageViewEvent.findMany({
        where: {
          projectId,
        },
        orderBy: {
          timestamp: "desc",
        },
        take: limit,
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
      const countriesWithVisits = await prisma.pageViewEvent.groupBy({
        by: ["country", "countryCode", "lat", "lon"],
        where: {
          projectId,
          country: { not: null },
          countryCode: { not: null },
        },
        _count: {
          country: true,
        },
      });

      // Get city breakdown for each country
      const countriesWithCities = await Promise.all(
        countriesWithVisits.map(
          async (country: CountryWithVisits): Promise<CountryWithCities> => {
            const cities = await prisma.pageViewEvent.groupBy({
              by: ["city"],
              where: {
                projectId,
                country: country.country,
                city: { not: null },
              },
              _count: {
                city: true,
              },
              orderBy: {
                _count: {
                  city: "desc",
                },
              },
            });

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
      const countriesWithVisits = await prisma.pageViewEvent.groupBy({
        by: ["country", "countryCode"],
        where: {
          projectId,
          country: { not: null },
          countryCode: { not: null },
        },
        _count: {
          country: true,
        },
      });

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
            const mobileVisits = await prisma.pageViewEvent.count({
              where: {
                projectId,
                country: country.country,
                mobile: true,
              },
            });

            const desktopVisits = await prisma.pageViewEvent.count({
              where: {
                projectId,
                country: country.country,
                mobile: false,
              },
            });

            // Get unique visits by IP
            const uniqueVisits = await prisma.pageViewEvent.groupBy({
              by: ["ip"],
              where: {
                projectId,
                country: country.country,
                ip: { not: null },
              },
              _count: {
                ip: true,
              },
            });

            return {
              country: country.country || "",
              countryCode,
              totalVisits: Number(country._count.country) || 0,
              mobileVisits: Number(mobileVisits) || 0,
              desktopVisits: Number(desktopVisits) || 0,
              uniqueVisits: Number(uniqueVisits.length) || 0,
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

      // Get all unique sessions grouped by country
      const sessionsByCountry = await prisma.trackedSession.groupBy({
        by: ["country"],
        where: {
          projectId,
          country: { not: null },
        },
        _count: {
          country: true,
        },
      });

      // Get country codes by joining with pageViewEvents
      const countriesWithStats = await Promise.all(
        sessionsByCountry.map(async (sessionGroup) => {
          const country = sessionGroup.country || "";

          // Get countryCode from a related pageViewEvent
          const samplePageView = await prisma.pageViewEvent.findFirst({
            where: {
              projectId,
              country,
              countryCode: { not: null },
            },
            select: {
              countryCode: true,
            },
          });

          const countryCode = samplePageView?.countryCode;
          if (!countryCode) {
            return null;
          }

          const coordinates = findCountryCoordinates(countryCode);
          if (!coordinates) {
            return null;
          }

          // Get mobile vs desktop breakdown from sessions
          const mobileSessions = await prisma.trackedSession.count({
            where: {
              projectId,
              country,
              pageViewEvents: {
                some: {
                  mobile: true,
                },
              },
            },
          });

          const desktopSessions = await prisma.trackedSession.count({
            where: {
              projectId,
              country,
              pageViewEvents: {
                some: {
                  mobile: false,
                },
              },
            },
          });

          return {
            country,
            countryCode,
            totalVisits: Number(sessionGroup._count.country) || 0,
            mobileVisits: Number(mobileSessions) || 0,
            desktopVisits: Number(desktopSessions) || 0,
            uniqueVisits: Number(sessionGroup._count.country) || 0, // Sessions are unique visitors
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

  // Get all unique country codes from the database
  const uniqueCountryCodes = await prisma.pageViewEvent.groupBy({
    by: ["country", "countryCode"],
    where: {
      projectId,
      country: { not: null },
      countryCode: { not: null },
    },
    _count: {
      countryCode: true,
    },
  });

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

      // Get unique sessions grouped by country
      const sessionsByCountry = await prisma.trackedSession.groupBy({
        by: ["country"],
        where: {
          projectId,
          country: { not: null },
        },
        _count: {
          country: true,
        },
      });

      // Map to alpha-3 codes and get visitor counts with additional stats
      const visitorsData = await Promise.all(
        sessionsByCountry.map(async (sessionGroup) => {
          const country = sessionGroup.country || "";

          // Get countryCode from a related pageViewEvent
          const samplePageView = await prisma.pageViewEvent.findFirst({
            where: {
              projectId,
              country,
              countryCode: { not: null },
            },
            select: {
              countryCode: true,
            },
          });

          const countryCode = samplePageView?.countryCode;
          if (!countryCode) {
            return null;
          }

          // Get alpha-3 code from coordinates
          const coordinates = findCountryCoordinates(countryCode);
          if (!coordinates || !coordinates.alpha3Code) {
            return null;
          }

          const totalSessions = Number(sessionGroup._count.country) || 0;

          // Get bounce rate for this country
          const bouncedSessions = await prisma.trackedSession.count({
            where: {
              projectId,
              country,
              didBounce: true,
            },
          });

          const bounceRate =
            totalSessions > 0 ? (bouncedSessions / totalSessions) * 100 : 0;

          // Get mobile vs desktop breakdown
          const mobileSessions = await prisma.trackedSession.count({
            where: {
              projectId,
              country,
              pageViewEvents: {
                some: {
                  mobile: true,
                },
              },
            },
          });

          const desktopSessions = await prisma.trackedSession.count({
            where: {
              projectId,
              country,
              pageViewEvents: {
                some: {
                  mobile: false,
                },
              },
            },
          });

          return {
            id: coordinates.alpha3Code,
            value: totalSessions,
            totalSessions,
            bounceRate: Math.round(bounceRate * 100) / 100,
            mobileSessions,
            desktopSessions,
          };
        }),
      );

      // Filter out null values and return
      return visitorsData.filter(
        (
          item,
        ): item is {
          id: string;
          value: number;
          totalSessions: number;
          bounceRate: number;
          mobileSessions: number;
          desktopSessions: number;
        } => item !== null,
      );
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

      const uniqueMobileVisits = await prisma.pageViewEvent.groupBy({
        by: ["sessionId", "ip"],
        where: {
          projectId,
          mobile: true,
          ...dateFilter,
        },
        _count: {
          sessionId: true,
        },
      });

      const uniqueDesktopVisits = await prisma.pageViewEvent.groupBy({
        by: ["sessionId", "ip"],
        where: {
          projectId,
          mobile: false,
          ...dateFilter,
        },
        _count: {
          sessionId: true,
        },
      });

      return {
        mobile: uniqueMobileVisits.length,
        desktop: uniqueDesktopVisits.length,
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

      const events = await prisma.pageViewEvent.findMany({
        where: {
          projectId,
          ...dateFilter,
        },
        select: { url: true },
      });

      // Count occurrences by pathname
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

      const pageViews = await prisma.pageViewEvent.findMany({
        where: {
          projectId,
          userAgent: { not: null },
          ...dateFilter,
        },
        select: {
          userAgent: true,
        },
      });

      // Parse user agents to extract browser information
      const browserStats: Record<string, number> = {};

      pageViews.forEach((view: { userAgent: string | null }) => {
        const userAgent = view.userAgent || "";
        let browser = "Unknown";

        // Simple browser detection logic
        if (userAgent.includes("Chrome")) {
          browser = "Chrome";
        } else if (userAgent.includes("Firefox")) {
          browser = "Firefox";
        } else if (
          userAgent.includes("Safari") &&
          !userAgent.includes("Chrome")
        ) {
          browser = "Safari";
        } else if (userAgent.includes("Edge")) {
          browser = "Edge";
        } else if (userAgent.includes("Opera")) {
          browser = "Opera";
        } else if (
          userAgent.includes("MSIE") ||
          userAgent.includes("Trident")
        ) {
          browser = "Internet Explorer";
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

      const sessions = await prisma.trackedSession.findMany({
        where: {
          projectId,
          ...dateFilter,
        },
        include: {
          pageViewEvents: {
            orderBy: { timestamp: "asc" },
          },
        },
        orderBy: {
          startedAt: "desc",
        },
      });

      const totalSessions = sessions.length;
      const bouncedSessions = sessions.filter(
        (s: SessionData) => s.didBounce,
      ).length;
      const bounceRate =
        totalSessions > 0 ? (bouncedSessions / totalSessions) * 100 : 0;

      const avgSessionDuration =
        sessions.length > 0
          ? sessions.reduce(
              (sum: number, s: SessionData) => sum + (s.duration || 0),
              0,
            ) / sessions.length
          : 0;

      const avgPageViews =
        sessions.length > 0
          ? sessions.reduce(
              (sum: number, s: SessionData) => sum + s.pageViewEvents.length,
              0,
            ) / sessions.length
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

      const trackedEvents = await prisma.trackedEvent.findMany({
        where: {
          eventDefinition: { projectId },
          ...dateFilter,
        },
        select: {
          sessionId: true,
        },
      });

      const uniqueSessionIds = new Set<string>();
      for (const event of trackedEvents) {
        if (event.sessionId) {
          uniqueSessionIds.add(event.sessionId);
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

      const liveUsers = await prisma.trackedSession.count({
        where: {
          projectId,
          endedAt: null,
          startedAt: {
            gte: thirtyMinutesAgo,
          },
        },
      });

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
