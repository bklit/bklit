"use client";

import { useQuery } from "@tanstack/react-query";
import { CreditCard, Globe, MousePointer, Search, Share2 } from "lucide-react";
import { parseAsBoolean, parseAsIsoDateTime, useQueryStates } from "nuqs";
import { useMemo } from "react";
import { DateRangePicker } from "@/components/date-range-picker";
import { PageHeader } from "@/components/header/page-header";
import { Stats } from "@/components/stats";
import { getPreviousPeriod } from "@/lib/date-utils";
import { calculateChange } from "@/lib/stats-utils";
import { useTRPC } from "@/trpc/react";
import { AcquisitionsChart } from "./acquisitions-chart";
import { AcquisitionsTable } from "./acquisitions-table";

interface AcquisitionsProps {
  organizationId: string;
  projectId: string;
}

export function Acquisitions({ organizationId, projectId }: AcquisitionsProps) {
  const trpc = useTRPC();

  const [dateParams] = useQueryStates(
    {
      startDate: parseAsIsoDateTime,
      endDate: parseAsIsoDateTime,
      compare: parseAsBoolean.withDefault(true),
    },
    {
      history: "push",
    }
  );

  const startDate = useMemo(() => {
    if (dateParams.startDate) {
      return dateParams.startDate;
    }
    if (!dateParams.endDate) {
      return undefined;
    }
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  }, [dateParams.startDate, dateParams.endDate]);

  const endDate = dateParams.endDate ?? undefined;
  const compare = dateParams.compare;

  const { data: statsData, isLoading: statsLoading } = useQuery(
    trpc.acquisition.getStats.queryOptions({
      projectId,
      organizationId,
      startDate,
      endDate,
    })
  );

  // Calculate previous period dates for comparison
  const { startDate: prevStartDate, endDate: prevEndDate } = useMemo(() => {
    if (!(compare && startDate && endDate)) {
      return { startDate: undefined, endDate: undefined };
    }
    return getPreviousPeriod(startDate, endDate);
  }, [compare, startDate, endDate]);

  // Fetch previous period stats for comparison
  const { data: prevStatsData, isLoading: prevStatsLoading } = useQuery({
    ...trpc.acquisition.getStats.queryOptions({
      projectId,
      organizationId,
      startDate: prevStartDate,
      endDate: prevEndDate,
    }),
    enabled: compare && !!prevStartDate && !!prevEndDate,
  });

  return (
    <>
      <PageHeader
        description={
          statsLoading
            ? "Loading acquisitions..."
            : `${statsData?.totalViews || 0} total views`
        }
        title="Acquisitions"
      >
        <div className="flex items-center gap-2">
          <DateRangePicker />
        </div>
      </PageHeader>
      <div className="container mx-auto flex flex-col gap-4">
        <Stats
          items={[
            {
              icon: Globe,
              name: "Total Views",
              stat: statsData?.totalViews || 0,
              ...(compare &&
                prevStatsData && {
                  ...calculateChange(
                    statsData?.totalViews || 0,
                    prevStatsData?.totalViews || 0
                  ),
                }),
              ...(compare &&
                !prevStatsData && {
                  changeLoading: prevStatsLoading,
                }),
            },
            {
              icon: MousePointer,
              name: "Direct Traffic",
              stat: statsData?.directTraffic || 0,
              ...(compare &&
                prevStatsData && {
                  ...calculateChange(
                    statsData?.directTraffic || 0,
                    prevStatsData?.directTraffic || 0
                  ),
                }),
              ...(compare &&
                !prevStatsData && {
                  changeLoading: prevStatsLoading,
                }),
            },
            {
              icon: Search,
              name: "Organic Traffic",
              stat: statsData?.organicTraffic || 0,
              ...(compare &&
                prevStatsData && {
                  ...calculateChange(
                    statsData?.organicTraffic || 0,
                    prevStatsData?.organicTraffic || 0
                  ),
                }),
              ...(compare &&
                !prevStatsData && {
                  changeLoading: prevStatsLoading,
                }),
            },
            {
              icon: Share2,
              name: "Social Traffic",
              stat: statsData?.socialTraffic || 0,
              ...(compare &&
                prevStatsData && {
                  ...calculateChange(
                    statsData?.socialTraffic || 0,
                    prevStatsData?.socialTraffic || 0
                  ),
                }),
              ...(compare &&
                !prevStatsData && {
                  changeLoading: prevStatsLoading,
                }),
            },
            {
              icon: CreditCard,
              name: "Paid Traffic",
              stat: statsData?.paidTraffic || 0,
              ...(compare &&
                prevStatsData && {
                  ...calculateChange(
                    statsData?.paidTraffic || 0,
                    prevStatsData?.paidTraffic || 0
                  ),
                }),
              ...(compare &&
                !prevStatsData && {
                  changeLoading: prevStatsLoading,
                }),
            },
          ]}
        />

        {/* Acquisitions Chart */}
        <AcquisitionsChart
          organizationId={organizationId}
          projectId={projectId}
        />
        {/* Acquisitions List */}
        <AcquisitionsTable
          organizationId={organizationId}
          projectId={projectId}
        />
      </div>
    </>
  );
}
