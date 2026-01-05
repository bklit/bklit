import { ANALYTICS_UNLIMITED_QUERY_LIMIT } from "@bklit/analytics/constants";
import { z } from "zod";
import { endOfDay, parseClickHouseDate, startOfDay } from "../lib/date-utils";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const acquisitionRouter = createTRPCRouter({
  getAcquisitions: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        organizationId: z.string(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      // Check if user has access to this project
      const project = await ctx.prisma.project.findFirst({
        where: {
          id: input.projectId,
          organizationId: input.organizationId,
        },
      });

      if (!project) {
        throw new Error("Project not found");
      }

      // Date filter
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

      const pageviews = await ctx.analytics.getPageViews({
        projectId: input.projectId,
        startDate: normalizedStartDate,
        endDate: normalizedEndDate,
        limit: ANALYTICS_UNLIMITED_QUERY_LIMIT,
      });

      const acquisitionGroups = pageviews.reduce(
        (acc, pageview) => {
          const source = getAcquisitionSource({
            referrer: pageview.referrer,
            utmSource: pageview.utm_source,
            utmMedium: pageview.utm_medium,
            utmCampaign: pageview.utm_campaign,
          });
          const timestamp = parseClickHouseDate(pageview.timestamp);

          if (!acc[source]) {
            acc[source] = {
              source,
              sourceType: getSourceType({
                referrer: pageview.referrer,
                utmSource: pageview.utm_source,
              }),
              viewCount: 0,
              uniqueUsers: new Set<string>(),
              lastViewed: timestamp,
              firstViewed: timestamp,
            };
          }
          acc[source].viewCount += 1;
          if (pageview.ip) {
            acc[source].uniqueUsers.add(pageview.ip);
          }
          if (timestamp > acc[source].lastViewed) {
            acc[source].lastViewed = timestamp;
          }
          if (timestamp < acc[source].firstViewed) {
            acc[source].firstViewed = timestamp;
          }
          return acc;
        },
        {} as Record<
          string,
          {
            source: string;
            sourceType: string;
            viewCount: number;
            uniqueUsers: Set<string>;
            lastViewed: Date;
            firstViewed: Date;
          }
        >,
      );

      // Convert to array and sort by view count
      const acquisitionGroupsArray = Object.values(acquisitionGroups).sort(
        (a, b) => b.viewCount - a.viewCount,
      );

      // Apply pagination
      const paginatedAcquisitions = acquisitionGroupsArray.slice(
        (input.page - 1) * input.limit,
        input.page * input.limit,
      );

      // Transform data to include user metrics
      const acquisitionsWithUserMetrics = paginatedAcquisitions.map(
        (acquisition) => {
          const uniqueUserCount = acquisition.uniqueUsers.size;
          const avgViewsPerUser =
            uniqueUserCount > 0
              ? (acquisition.viewCount / uniqueUserCount).toFixed(1)
              : "0.0";

          return {
            source: acquisition.source,
            sourceType: acquisition.sourceType,
            viewCount: acquisition.viewCount,
            uniqueUserCount,
            avgViewsPerUser: parseFloat(avgViewsPerUser),
            lastViewed: acquisition.lastViewed,
            firstViewed: acquisition.firstViewed,
          };
        },
      );

      return {
        acquisitions: acquisitionsWithUserMetrics,
        totalCount: acquisitionGroupsArray.length,
        pagination: {
          page: input.page,
          limit: input.limit,
          totalPages: Math.ceil(acquisitionGroupsArray.length / input.limit),
          hasNextPage:
            input.page < Math.ceil(acquisitionGroupsArray.length / input.limit),
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
      // Check if user has access to this project
      const project = await ctx.prisma.project.findFirst({
        where: {
          id: input.projectId,
          organizationId: input.organizationId,
        },
      });

      if (!project) {
        throw new Error("Project not found");
      }

      // Date filter
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

      const pageviews = await ctx.analytics.getPageViews({
        projectId: input.projectId,
        startDate: normalizedStartDate,
        endDate: normalizedEndDate,
        limit: ANALYTICS_UNLIMITED_QUERY_LIMIT,
      });

      const totalViews = stats.total_views;
      const directTraffic = pageviews.filter((p) => !p.referrer).length;
      const organicTraffic = pageviews.filter(
        (p) =>
          p.referrer &&
          (p.referrer.includes("google.com") ||
            p.referrer.includes("bing.com") ||
            p.referrer.includes("yahoo.com")),
      ).length;
      const socialTraffic = pageviews.filter(
        (p) =>
          p.referrer &&
          (p.referrer.includes("facebook.com") ||
            p.referrer.includes("twitter.com") ||
            p.referrer.includes("linkedin.com") ||
            p.referrer.includes("instagram.com")),
      ).length;
      const paidTraffic = pageviews.filter((p) => p.utm_source).length;
      const mobileViews = stats.mobile_visits;
      const desktopViews = stats.desktop_visits;

      return {
        totalViews,
        directTraffic,
        organicTraffic,
        socialTraffic,
        paidTraffic,
        mobileViews,
        desktopViews,
        uniqueSources: 0, // Will be calculated from the acquisitions data
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
      // Check if user has access to this project
      const project = await ctx.prisma.project.findFirst({
        where: {
          id: input.projectId,
          organizationId: input.organizationId,
        },
      });

      if (!project) {
        throw new Error("Project not found");
      }

      // Date filter
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

      const pageviews = await ctx.analytics.getPageViews({
        projectId: input.projectId,
        startDate: normalizedStartDate,
        endDate: normalizedEndDate,
        limit: ANALYTICS_UNLIMITED_QUERY_LIMIT,
      });

      const acquisitionGroups = pageviews.reduce(
        (acc, pageview) => {
          const source = getAcquisitionSource({
            referrer: pageview.referrer,
            utmSource: pageview.utm_source,
            utmMedium: pageview.utm_medium,
            utmCampaign: pageview.utm_campaign,
          });
          const dateKey =
            parseClickHouseDate(pageview.timestamp)
              .toISOString()
              .split("T")[0] ?? "";

          if (!acc[source]) {
            acc[source] = {};
          }
          if (!acc[source][dateKey]) {
            acc[source][dateKey] = 0;
          }
          acc[source][dateKey] += 1;

          return acc;
        },
        {} as Record<string, Record<string, number>>,
      );

      const topSources = Object.entries(acquisitionGroups)
        .map(([source, dailyViews]) => {
          const samplePageview = pageviews.find(
            (p) =>
              getAcquisitionSource({
                referrer: p.referrer,
                utmSource: p.utm_source,
                utmMedium: p.utm_medium,
                utmCampaign: p.utm_campaign,
              }) === source,
          );
          const _sourceType = getSourceType({
            referrer: samplePageview?.referrer || null,
            utmSource: samplePageview?.utm_source || null,
          });
          return {
            source,
            sourceType: getSourceType({
              referrer: source,
              utmSource: null,
              utmMedium: null,
              utmCampaign: null,
            }),
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
        dateRange.push(currentDate.toISOString().split("T")[0] ?? "");
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Create time series data
      const timeSeriesData = dateRange.map((date) => {
        const dataPoint: Record<string, string | number> = { date };

        dataPoint.total = topSources.reduce((sum, source) => {
          return sum + (source.dailyViews[date] || 0);
        }, 0);

        topSources.forEach((source, index) => {
          dataPoint[`source${index}`] = source.dailyViews[date] || 0;
        });

        return dataPoint;
      });

      const result = {
        timeSeriesData,
        topSources: topSources.map((source, index) => ({
          source: source.source,
          sourceType: source.sourceType,
          totalViews: source.totalViews,
          dataKey: `source${index}`,
        })),
      };

      return result;
    }),
});

// Helper functions
function getAcquisitionSource(pageview: {
  referrer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
}): string {
  // UTM source takes priority
  if (pageview.utmSource) {
    const medium = pageview.utmMedium ? ` (${pageview.utmMedium})` : "";
    const campaign = pageview.utmCampaign ? ` - ${pageview.utmCampaign}` : "";
    return `${pageview.utmSource}${medium}${campaign}`;
  }

  // Check referrer
  if (pageview.referrer) {
    try {
      const url = new URL(pageview.referrer);
      return url.hostname;
    } catch {
      return pageview.referrer;
    }
  }

  // Direct traffic
  return "Direct";
}

function getSourceType(pageview: {
  referrer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
}): string {
  // UTM source
  if (pageview.utmSource) {
    if (pageview.utmMedium === "cpc" || pageview.utmMedium === "paid") {
      return "Paid";
    }
    return "UTM";
  }

  // Check referrer
  if (pageview.referrer) {
    try {
      const url = new URL(pageview.referrer);
      const hostname = url.hostname.toLowerCase();

      if (
        hostname.includes("google") ||
        hostname.includes("bing") ||
        hostname.includes("yahoo")
      ) {
        return "Organic";
      }
      if (
        hostname.includes("facebook") ||
        hostname.includes("twitter") ||
        hostname.includes("linkedin") ||
        hostname.includes("instagram")
      ) {
        return "Social";
      }
      return "Referral";
    } catch {
      return "Referral";
    }
  }

  return "Direct";
}
