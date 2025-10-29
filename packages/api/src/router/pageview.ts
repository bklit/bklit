import { z } from "zod";
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
      }),
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

      if (
        !project ||
        !project.organization ||
        project.organization.members.length === 0
      ) {
        throw new Error("Forbidden");
      }

      const dateFilter =
        input.startDate || input.endDate
          ? {
              timestamp: {
                ...(input.startDate && { gte: input.startDate }),
                ...(input.endDate && { lte: input.endDate }),
              },
            }
          : undefined;

      // Get pageviews for grouping

      // Get pageviews grouped by URL
      const pageviews = await ctx.prisma.pageViewEvent.findMany({
        where: {
          projectId: input.projectId,
          ...(dateFilter && dateFilter),
        },
        select: {
          url: true,
          timestamp: true,
          userAgent: true,
          country: true,
          city: true,
          mobile: true,
        },
        orderBy: {
          timestamp: "desc",
        },
      });

      // Group by URL and count views
      const pageGroups = pageviews.reduce(
        (acc, pageview) => {
          // Normalize URL to group by pathname only (ignore query params and fragments)
          const normalizedUrl = extractPath(pageview.url);
          const originalUrl = pageview.url;

          if (!acc[normalizedUrl]) {
            acc[normalizedUrl] = {
              url: originalUrl, // Keep original URL for reference
              title: extractPageTitle(originalUrl),
              path: normalizedUrl,
              viewCount: 0,
              lastViewed: pageview.timestamp,
              firstViewed: pageview.timestamp,
            };
          }
          acc[normalizedUrl].viewCount += 1;
          if (pageview.timestamp > acc[normalizedUrl].lastViewed) {
            acc[normalizedUrl].lastViewed = pageview.timestamp;
          }
          if (pageview.timestamp < acc[normalizedUrl].firstViewed) {
            acc[normalizedUrl].firstViewed = pageview.timestamp;
          }
          return acc;
        },
        {} as Record<
          string,
          {
            url: string;
            title: string;
            path: string;
            viewCount: number;
            lastViewed: Date;
            firstViewed: Date;
          }
        >,
      );

      // Convert to array and sort by view count
      const pageGroupsArray = Object.values(pageGroups).sort(
        (a, b) => b.viewCount - a.viewCount,
      );

      // Apply pagination
      const paginatedPages = pageGroupsArray.slice(
        (input.page - 1) * input.limit,
        input.page * input.limit,
      );

      return {
        pages: paginatedPages,
        totalCount: pageGroupsArray.length,
        pagination: {
          page: input.page,
          limit: input.limit,
          totalPages: Math.ceil(pageGroupsArray.length / input.limit),
          hasNextPage:
            input.page < Math.ceil(pageGroupsArray.length / input.limit),
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
      }),
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

      if (
        !project ||
        !project.organization ||
        project.organization.members.length === 0
      ) {
        throw new Error("Forbidden");
      }

      const dateFilter =
        input.startDate || input.endDate
          ? {
              timestamp: {
                ...(input.startDate && { gte: input.startDate }),
                ...(input.endDate && { lte: input.endDate }),
              },
            }
          : undefined;

      const [totalViews, uniquePages, mobileViews, desktopViews] =
        await Promise.all([
          ctx.prisma.pageViewEvent.count({
            where: {
              projectId: input.projectId,
              ...(dateFilter && dateFilter),
            },
          }),
          ctx.prisma.pageViewEvent.findMany({
            where: {
              projectId: input.projectId,
              ...(dateFilter && dateFilter),
            },
            distinct: ["url"],
            select: { url: true },
          }),
          ctx.prisma.pageViewEvent.count({
            where: {
              projectId: input.projectId,
              mobile: true,
              ...(dateFilter && dateFilter),
            },
          }),
          ctx.prisma.pageViewEvent.count({
            where: {
              projectId: input.projectId,
              mobile: false,
              ...(dateFilter && dateFilter),
            },
          }),
        ]);

      return {
        totalViews,
        uniquePages: uniquePages.length,
        mobileViews,
        desktopViews,
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
      }),
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

      if (
        !project ||
        !project.organization ||
        project.organization.members.length === 0
      ) {
        throw new Error("Forbidden");
      }

      const dateFilter =
        input.startDate || input.endDate
          ? {
              timestamp: {
                ...(input.startDate && { gte: input.startDate }),
                ...(input.endDate && { lte: input.endDate }),
              },
            }
          : undefined;

      // Get pageviews for time series analysis
      const pageviews = await ctx.prisma.pageViewEvent.findMany({
        where: {
          projectId: input.projectId,
          ...(dateFilter && dateFilter),
        },
        select: {
          url: true,
          timestamp: true,
        },
        orderBy: {
          timestamp: "asc",
        },
      });

      // Group by URL and count views per day
      const pageGroups = pageviews.reduce(
        (acc, pageview) => {
          const normalizedUrl = extractPath(pageview.url);
          const dateKey = pageview.timestamp.toISOString().split("T")[0];

          if (!acc[normalizedUrl]) {
            acc[normalizedUrl] = {};
          }
          if (!acc[normalizedUrl][dateKey]) {
            acc[normalizedUrl][dateKey] = 0;
          }
          acc[normalizedUrl][dateKey] += 1;

          return acc;
        },
        {} as Record<string, Record<string, number>>,
      );

      // Get top pages by total views
      const topPages = Object.entries(pageGroups)
        .map(([path, dailyViews]) => {
          // Create a full URL for title extraction
          const fullUrl = `http://localhost:3000${path}`;
          const title = extractPageTitle(fullUrl);
          return {
            path,
            title,
            totalViews: Object.values(dailyViews).reduce(
              (sum, count) => sum + count,
              0,
            ),
            dailyViews,
          };
        })
        .sort((a, b) => b.totalViews - a.totalViews)
        .slice(0, input.limit);

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
        dateRange.push(currentDate.toISOString().split("T")[0]);
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
});

// Helper functions
function extractPageTitle(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    // Extract title from pathname
    if (pathname === "/" || pathname === "") {
      return "Home";
    }

    // Remove leading slash and split by slashes
    const segments = pathname.replace(/^\//, "").split("/").filter(Boolean);

    if (segments.length === 0) return "Home";

    // Take the last segment and format it
    const lastSegment = segments[segments.length - 1];

    // Handle numeric segments (like product IDs)
    if (/^\d+$/.test(lastSegment)) {
      // If it's a number, use the parent segment or a generic name
      if (segments.length > 1) {
        const parentSegment = segments[segments.length - 2];
        return `${formatSegment(parentSegment)} #${lastSegment}`;
      }
      return `Page #${lastSegment}`;
    }

    // Handle query parameters or fragments
    const cleanSegment = lastSegment.split("?")[0].split("#")[0];

    // Convert to title case
    return formatSegment(cleanSegment);
  } catch (error) {
    return "Unknown Page";
  }
}

function formatSegment(segment: string): string {
  if (!segment) return "Unknown Page";

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
