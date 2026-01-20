import { z } from "zod";
import { endOfDay, parseClickHouseDate, startOfDay } from "../lib/date-utils";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const pageviewRouter = createTRPCRouter({
  getPageviews: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        organizationId: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      const project = await ctx.prisma.project.findFirst({
        where: {
          id: input.projectId,
          organizationId: input.organizationId,
        },
        include: {
          organization: {
            include: {
              members: {
                where: { userId: ctx.session.user.id },
              },
            },
          },
        },
      });

      if (!project?.organization || project.organization.members.length === 0) {
        throw new Error("Forbidden");
      }

      const normalizedStartDate = input.startDate
        ? startOfDay(input.startDate)
        : undefined;
      const normalizedEndDate = input.endDate
        ? endOfDay(input.endDate)
        : undefined;

      const _dateFilter =
        normalizedStartDate || normalizedEndDate
          ? {
              timestamp: {
                ...(normalizedStartDate && { gte: normalizedStartDate }),
                ...(normalizedEndDate && { lte: normalizedEndDate }),
              },
            }
          : undefined;

      // Optimized: Get aggregated page data from ClickHouse
      const [topPages, totalPages] = await Promise.all([
        ctx.analytics.getTopPagesByUrl({
          projectId: input.projectId,
          startDate: normalizedStartDate,
          endDate: normalizedEndDate,
          limit: input.limit,
          offset: (input.page - 1) * input.limit,
        }),
        ctx.analytics.getTopPagesCount({
          projectId: input.projectId,
          startDate: normalizedStartDate,
          endDate: normalizedEndDate,
        }),
      ]);

      // Add path extraction and title fallback
      const pagesWithMetadata = topPages.map((page) => {
        const path = extractPath(page.url);
        const title = page.title || extractPageTitle(page.url);
        const avgViewsPerUser =
          page.uniqueUserCount > 0 ? page.viewCount / page.uniqueUserCount : 0;

        return {
          url: page.url,
          title,
          path,
          viewCount: page.viewCount,
          uniqueUserCount: page.uniqueUserCount,
          avgViewsPerUser: Number.parseFloat(avgViewsPerUser.toFixed(1)),
          lastViewed: page.lastViewed,
          firstViewed: page.firstViewed,
        };
      });

      return {
        pages: pagesWithMetadata,
        totalCount: totalPages,
        pagination: {
          page: input.page,
          limit: input.limit,
          totalPages: Math.ceil(totalPages / input.limit),
          hasNextPage: input.page < Math.ceil(totalPages / input.limit),
          hasPreviousPage: input.page > 1,
        },
      };
    }),

  getStats: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        organizationId: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const project = await ctx.prisma.project.findFirst({
        where: {
          id: input.projectId,
          organizationId: input.organizationId,
        },
        include: {
          organization: {
            include: {
              members: {
                where: { userId: ctx.session.user.id },
              },
            },
          },
        },
      });

      if (!project?.organization || project.organization.members.length === 0) {
        throw new Error("Forbidden");
      }

      const normalizedStartDate = input.startDate
        ? startOfDay(input.startDate)
        : undefined;
      const normalizedEndDate = input.endDate
        ? endOfDay(input.endDate)
        : undefined;

      const _dateFilter =
        normalizedStartDate || normalizedEndDate
          ? {
              timestamp: {
                ...(normalizedStartDate && { gte: normalizedStartDate }),
                ...(normalizedEndDate && { lte: normalizedEndDate }),
              },
            }
          : undefined;

      const stats = await ctx.analytics.getStats({
        projectId: input.projectId,
        startDate: normalizedStartDate,
        endDate: normalizedEndDate,
      });

      return {
        totalViews: stats.total_views,
        uniquePages: stats.unique_pages,
        mobileViews: stats.mobile_visits,
        desktopViews: stats.desktop_visits,
      };
    }),

  getAnalyticsStats: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        organizationId: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const project = await ctx.prisma.project.findFirst({
        where: {
          id: input.projectId,
          organizationId: input.organizationId,
        },
        include: {
          organization: {
            include: {
              members: {
                where: { userId: ctx.session.user.id },
              },
            },
          },
        },
      });

      if (!project?.organization || project.organization.members.length === 0) {
        throw new Error("Forbidden");
      }

      const defaultStartDate = input.startDate
        ? startOfDay(input.startDate)
        : (() => {
            const date = startOfDay(new Date());
            date.setDate(date.getDate() - 30);
            return date;
          })();

      const normalizedEndDate = input.endDate
        ? endOfDay(input.endDate)
        : endOfDay(new Date());

      const stats = await ctx.analytics.getStats({
        projectId: input.projectId,
        startDate: defaultStartDate,
        endDate: normalizedEndDate,
      });

      const totalViews = await ctx.analytics.countPageViews(input.projectId);
      const recentViews = stats.total_views;
      const uniquePages = stats.unique_pages;
      const uniqueVisits = stats.unique_visits;

      return {
        totalViews,
        recentViews,
        uniquePages: uniquePages || 0,
        uniqueVisits: uniqueVisits || 0,
      };
    }),

  getEntryPoints: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        organizationId: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      // Check project access
      const project = await ctx.prisma.project.findFirst({
        where: {
          id: input.projectId,
          organizationId: input.organizationId,
        },
        include: {
          organization: {
            include: {
              members: {
                where: { userId: ctx.session.user.id },
              },
            },
          },
        },
      });

      if (!project?.organization || project.organization.members.length === 0) {
        throw new Error("Forbidden");
      }

      const normalizedStartDate = input.startDate
        ? startOfDay(input.startDate)
        : undefined;
      const normalizedEndDate = input.endDate
        ? endOfDay(input.endDate)
        : undefined;

      const _dateFilter =
        normalizedStartDate || normalizedEndDate
          ? {
              startedAt: {
                ...(normalizedStartDate && { gte: normalizedStartDate }),
                ...(normalizedEndDate && { lte: normalizedEndDate }),
              },
            }
          : undefined;

      // Optimized: Get entry pages aggregated from ClickHouse
      // Note: Entry points need session data, so we still fetch sessions but paginated
      const allSessions = await ctx.analytics.getSessions({
        projectId: input.projectId,
        startDate: normalizedStartDate,
        endDate: normalizedEndDate,
        limit: 10_000, // Reasonable limit instead of 100k
      });

      const pageviews = await ctx.analytics.getPageViews({
        projectId: input.projectId,
        startDate: normalizedStartDate,
        endDate: normalizedEndDate,
        limit: 10_000, // Reasonable limit instead of 100k
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
              mobile: pv.mobile,
            });
          }
          return acc;
        },
        {} as Record<
          string,
          Array<{
            id: string;
            url: string;
            timestamp: Date;
            mobile: boolean | null;
          }>
        >
      );

      // Build a map of path -> latest title from pageviews
      const pathToTitle = pageviews.reduce(
        (acc, pv) => {
          const path = extractPath(pv.url);
          const timestamp = parseClickHouseDate(pv.timestamp);

          if (!acc[path]) {
            acc[path] = {
              title: pv.title || extractPageTitle(pv.url),
              timestamp,
            };
          } else if (pv.title && timestamp > acc[path].timestamp) {
            // Update with latest actual title
            acc[path] = {
              title: pv.title,
              timestamp,
            };
          }

          return acc;
        },
        {} as Record<string, { title: string; timestamp: Date }>
      );

      const entryPageGroups = allSessions.reduce(
        (acc, session) => {
          const entryPage = extractPath(session.entry_page);
          const originalUrl = session.entry_page;
          const startedAt = parseClickHouseDate(session.started_at);
          const pageViews = pageviewsBySession[session.session_id] || [];

          if (acc[entryPage]) {
            if (startedAt > acc[entryPage].lastVisited) {
              acc[entryPage].url = originalUrl;
            }
          } else {
            acc[entryPage] = {
              url: originalUrl,
              sessions: 0,
              totalPageviews: 0,
              uniqueSessions: new Set(),
              lastVisited: startedAt,
              firstVisited: startedAt,
              countries: new Set(),
              cities: new Set(),
              mobileSessions: 0,
              desktopSessions: 0,
            };
          }

          acc[entryPage].sessions += 1;
          acc[entryPage].totalPageviews += pageViews.length;
          acc[entryPage].uniqueSessions.add(session.session_id);
          acc[entryPage].lastVisited = new Date(
            Math.max(acc[entryPage].lastVisited.getTime(), startedAt.getTime())
          );
          acc[entryPage].firstVisited = new Date(
            Math.min(acc[entryPage].firstVisited.getTime(), startedAt.getTime())
          );

          if (session.country) {
            acc[entryPage].countries.add(session.country);
          }
          if (session.city) {
            acc[entryPage].cities.add(session.city);
          }

          const isMobile =
            pageViews.some((pv) => pv.mobile) ||
            (session.user_agent &&
              /Mobile|Android|iPhone|iPad/.test(session.user_agent));

          if (isMobile) {
            acc[entryPage].mobileSessions += 1;
          } else {
            acc[entryPage].desktopSessions += 1;
          }

          return acc;
        },
        {} as Record<
          string,
          {
            url: string;
            sessions: number;
            totalPageviews: number;
            uniqueSessions: Set<string>;
            lastVisited: Date;
            firstVisited: Date;
            countries: Set<string>;
            cities: Set<string>;
            mobileSessions: number;
            desktopSessions: number;
          }
        >
      );

      // Convert to array and format
      const entryPages = Object.values(entryPageGroups).map((group) => {
        const path = extractPath(group.url);
        return {
          url: group.url,
          // Use latest title from pathToTitle map, fallback to inferred
          title: pathToTitle[path]?.title || extractPageTitle(group.url),
          path,
          sessions: group.sessions,
          totalPageviews: group.totalPageviews,
          uniqueSessions: group.uniqueSessions.size,
          lastVisited: group.lastVisited,
          firstVisited: group.firstVisited,
          countries: Array.from(group.countries),
          cities: Array.from(group.cities),
          mobileSessions: group.mobileSessions,
          desktopSessions: group.desktopSessions,
        };
      });

      // Sort by sessions count
      const sortedEntryPages = entryPages.sort(
        (a, b) => b.sessions - a.sessions
      );

      // Apply pagination
      const paginatedPages = sortedEntryPages.slice(
        (input.page - 1) * input.limit,
        input.page * input.limit
      );

      return {
        entryPages: paginatedPages,
        totalCount: sortedEntryPages.length,
        pagination: {
          page: input.page,
          limit: input.limit,
          totalPages: Math.ceil(sortedEntryPages.length / input.limit),
          hasNextPage:
            input.page < Math.ceil(sortedEntryPages.length / input.limit),
          hasPreviousPage: input.page > 1,
        },
      };
    }),

  getTimeSeries: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        organizationId: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().min(1).max(10).default(5),
      })
    )
    .query(async ({ input, ctx }) => {
      const project = await ctx.prisma.project.findFirst({
        where: {
          id: input.projectId,
          organizationId: input.organizationId,
        },
        include: {
          organization: {
            include: {
              members: {
                where: { userId: ctx.session.user.id },
              },
            },
          },
        },
      });

      if (!project?.organization || project.organization.members.length === 0) {
        throw new Error("Forbidden");
      }

      const normalizedStartDate = input.startDate
        ? startOfDay(input.startDate)
        : undefined;
      const normalizedEndDate = input.endDate
        ? endOfDay(input.endDate)
        : undefined;

      const _dateFilter =
        normalizedStartDate || normalizedEndDate
          ? {
              timestamp: {
                ...(normalizedStartDate && { gte: normalizedStartDate }),
                ...(normalizedEndDate && { lte: normalizedEndDate }),
              },
            }
          : undefined;

      // Optimized: Get top pages with daily data from ClickHouse
      const topPagesData = await ctx.analytics.getTopPagesTimeSeries({
        projectId: input.projectId,
        startDate: normalizedStartDate,
        endDate: normalizedEndDate,
        limit: input.limit,
      });

      // Add path extraction and title fallback
      const topPages = topPagesData.map((pageData) => {
        const path = extractPath(pageData.url);
        const title = pageData.title || extractPageTitle(pageData.url);
        return {
          path,
          title,
          totalViews: pageData.totalViews,
          dailyViews: pageData.dailyViews,
        };
      });

      // Generate date range for the last 30 days if no dates provided
      const endDate = input.endDate || new Date();
      const startDate =
        input.startDate ||
        (() => {
          const date = new Date(endDate);
          date.setDate(date.getDate() - 30);
          return date;
        })();

      // Generate all dates in range
      const dateRange: string[] = [];
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        dateRange.push(currentDate.toISOString().split("T")[0] ?? "");
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Create time series data
      const timeSeriesData = dateRange.map((date) => {
        const dataPoint: Record<string, string | number> = { date };

        // Add total views for this date
        dataPoint.total = topPages.reduce((sum, page) => {
          return sum + (page.dailyViews[date] || 0);
        }, 0);

        // Add individual page data
        topPages.forEach((page, index) => {
          dataPoint[`page${index}`] = page.dailyViews[date] || 0;
        });

        return dataPoint;
      });

      const result = {
        timeSeriesData,
        topPages: topPages.map((page, index) => ({
          path: page.path,
          title: page.title,
          totalViews: page.totalViews,
          dataKey: `page${index}`,
        })),
      };

      return result;
    }),

  getEntryPointsTimeSeries: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        organizationId: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().min(1).max(10).default(5),
      })
    )
    .query(async ({ input, ctx }) => {
      const project = await ctx.prisma.project.findFirst({
        where: {
          id: input.projectId,
          organizationId: input.organizationId,
        },
        include: {
          organization: {
            include: {
              members: {
                where: { userId: ctx.session.user.id },
              },
            },
          },
        },
      });

      if (!project?.organization || project.organization.members.length === 0) {
        throw new Error("Forbidden");
      }

      const normalizedStartDate = input.startDate
        ? startOfDay(input.startDate)
        : undefined;
      const normalizedEndDate = input.endDate
        ? endOfDay(input.endDate)
        : undefined;

      const _dateFilter =
        normalizedStartDate || normalizedEndDate
          ? {
              startedAt: {
                ...(normalizedStartDate && { gte: normalizedStartDate }),
                ...(normalizedEndDate && { lte: normalizedEndDate }),
              },
            }
          : undefined;

      // Optimized: Get top entry pages with daily data from ClickHouse
      const topEntryPointsData = await ctx.analytics.getTopEntryPagesTimeSeries(
        {
          projectId: input.projectId,
          startDate: normalizedStartDate,
          endDate: normalizedEndDate,
          limit: input.limit,
        }
      );

      // Add path extraction and title inference
      const topEntryPoints = topEntryPointsData.map((entryData) => {
        const path = extractPath(entryData.entryPage);
        const title = extractPageTitle(entryData.entryPage);
        return {
          path,
          title,
          totalSessions: entryData.totalSessions,
          dailySessions: entryData.dailySessions,
        };
      });

      // Generate date range for the last 30 days if no dates provided
      const endDate = input.endDate || new Date();
      const startDate =
        input.startDate ||
        (() => {
          const date = new Date(endDate);
          date.setDate(date.getDate() - 30);
          return date;
        })();

      // Generate all dates in range
      const dateRange: string[] = [];
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        dateRange.push(currentDate.toISOString().split("T")[0] ?? "");
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Create time series data
      const timeSeriesData = dateRange.map((date) => {
        const dataPoint: Record<string, string | number> = { date };

        // Add total sessions for this date
        dataPoint.total = topEntryPoints.reduce((sum, entryPoint) => {
          return sum + (entryPoint.dailySessions[date] || 0);
        }, 0);

        // Add individual entry point data
        topEntryPoints.forEach((entryPoint, index) => {
          dataPoint[`entryPoint${index}`] = entryPoint.dailySessions[date] || 0;
        });

        return dataPoint;
      });

      const result = {
        timeSeriesData,
        topEntryPoints: topEntryPoints.map((entryPoint, index) => ({
          path: entryPoint.path,
          title: entryPoint.title,
          totalSessions: entryPoint.totalSessions,
          dataKey: `entryPoint${index}`,
        })),
      };

      return result;
    }),
});

// Helper functions
function extractPageTitle(url: string): string {
  try {
    // Handle both full URLs and paths
    const pathname = url.startsWith("http") ? new URL(url).pathname : url;

    // Extract title from pathname
    if (pathname === "/" || pathname === "") {
      return "Home";
    }

    // Remove leading slash and split by slashes
    const segments = pathname.replace(/^\//, "").split("/").filter(Boolean);

    if (segments.length === 0) {
      return "Home";
    }

    // Take the last segment and format it
    const lastSegment = segments.at(-1);

    // Handle numeric segments (like product IDs)
    if (lastSegment && /^\d+$/.test(lastSegment)) {
      // If it's a number, use the parent segment or a generic name
      if (segments.length > 1) {
        const parentSegment = segments.at(-2);
        return `${formatSegment(parentSegment ?? "")} #${lastSegment}`;
      }
      return `Page #${lastSegment}`;
    }

    // Handle query parameters or fragments
    const cleanSegment = lastSegment?.split("?")[0]?.split("#")[0] ?? "";

    // Convert to title case
    return formatSegment(cleanSegment);
  } catch {
    return "Unknown Page";
  }
}

function formatSegment(segment: string): string {
  if (!segment) {
    return "Unknown Page";
  }

  // Handle common patterns
  const commonMappings: Record<string, string> = {
    about: "About",
    contact: "Contact",
    products: "Products",
    services: "Services",
    blog: "Blog",
    news: "News",
    help: "Help",
    support: "Support",
    faq: "FAQ",
    pricing: "Pricing",
    features: "Features",
    docs: "Documentation",
    api: "API",
    dashboard: "Dashboard",
    profile: "Profile",
    settings: "Settings",
    login: "Login",
    signup: "Sign Up",
    register: "Register",
    "forgot-password": "Forgot Password",
    "reset-password": "Reset Password",
  };

  const lowerSegment = segment.toLowerCase();
  if (commonMappings[lowerSegment]) {
    return commonMappings[lowerSegment];
  }

  // Convert to title case
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function extractPath(url: string): string {
  try {
    const urlObj = new URL(url);
    // Normalize pathname - ensure it starts with / and handle root path
    const pathname = urlObj.pathname;
    return pathname === "" ? "/" : pathname;
  } catch {
    // If URL parsing fails, try to extract path manually
    const match = url.match(/^https?:\/\/[^/]+(\/.*)?$/);
    if (match) {
      return match[1] || "/";
    }
    return url;
  }
}
