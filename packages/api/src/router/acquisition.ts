import { z } from "zod";
import { endOfDay, startOfDay } from "../lib/date-utils";
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
      })
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

      // Optimized: Get aggregated acquisition sources from ClickHouse
      // This replaces fetching 100k pageviews and processing in JavaScript
      const [acquisitionSources, totalSources] = await Promise.all([
        ctx.analytics.getAcquisitionSources({
          projectId: input.projectId,
          startDate: normalizedStartDate,
          endDate: normalizedEndDate,
          limit: input.limit,
          offset: (input.page - 1) * input.limit,
        }),
        ctx.analytics.getAcquisitionSourcesCount({
          projectId: input.projectId,
          startDate: normalizedStartDate,
          endDate: normalizedEndDate,
        }),
      ]);

      // Add sourceType classification (needs JS for complex URL parsing)
      const acquisitionsWithTypes = acquisitionSources.map((acquisition) => {
        const sourceType = getSourceType({
          referrer: acquisition.sampleReferrer,
          utmSource: acquisition.sampleUtmSource,
          utmMedium: acquisition.sampleUtmMedium,
          utmCampaign: acquisition.sampleUtmCampaign,
        });

        const avgViewsPerUser =
          acquisition.uniqueUserCount > 0
            ? acquisition.viewCount / acquisition.uniqueUserCount
            : 0;

        return {
          source: acquisition.source,
          sourceType,
          viewCount: acquisition.viewCount,
          uniqueUserCount: acquisition.uniqueUserCount,
          avgViewsPerUser: Number.parseFloat(avgViewsPerUser.toFixed(1)),
          lastViewed: acquisition.lastViewed,
          firstViewed: acquisition.firstViewed,
        };
      });

      return {
        acquisitions: acquisitionsWithTypes,
        totalCount: totalSources,
        pagination: {
          page: input.page,
          limit: input.limit,
          totalPages: Math.ceil(totalSources / input.limit),
          hasNextPage: input.page < Math.ceil(totalSources / input.limit),
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

      // Optimized: Get all stats in parallel from ClickHouse
      const [stats, trafficTypeStats] = await Promise.all([
        ctx.analytics.getStats({
          projectId: input.projectId,
          startDate: normalizedStartDate,
          endDate: normalizedEndDate,
        }),
        ctx.analytics.getTrafficTypeStats({
          projectId: input.projectId,
          startDate: normalizedStartDate,
          endDate: normalizedEndDate,
        }),
      ]);

      return {
        totalViews: stats.total_views,
        directTraffic: trafficTypeStats.direct_traffic,
        organicTraffic: trafficTypeStats.organic_traffic,
        socialTraffic: trafficTypeStats.social_traffic,
        paidTraffic: trafficTypeStats.paid_traffic,
        utmTraffic: trafficTypeStats.utm_traffic, // Non-paid UTM campaigns
        mobileViews: stats.mobile_visits,
        desktopViews: stats.desktop_visits,
        uniqueSources: 0, // Placeholder - can be calculated if needed
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

      // Optimized: Get top sources with daily data from ClickHouse
      const topSourcesData = await ctx.analytics.getAcquisitionTimeSeries({
        projectId: input.projectId,
        startDate: normalizedStartDate,
        endDate: normalizedEndDate,
        limit: input.limit,
      });

      // Add sourceType classification
      const topSources = topSourcesData.map((sourceData) => ({
        source: sourceData.source,
        sourceType: getSourceType({
          referrer: sourceData.sampleReferrer,
          utmSource: sourceData.sampleUtmSource,
          utmMedium: sourceData.sampleUtmMedium,
          utmCampaign: sourceData.sampleUtmCampaign,
        }),
        totalViews: sourceData.totalViews,
        dailyViews: sourceData.dailyViews,
      }));

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
