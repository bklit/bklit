"use client";

import { useQuery } from "@tanstack/react-query";
import { Eye, Globe, Monitor, Smartphone } from "lucide-react";
import { parseAsIsoDateTime, useQueryStates } from "nuqs";
import { useMemo } from "react";
import { DateRangePicker } from "@/components/date-range-picker";
import { PageHeader } from "@/components/header/page-header";
import { Stats } from "@/components/stats";
import { useTRPC } from "@/trpc/react";
import { PageviewsChart } from "./pageviews-chart";
import { PageviewsTable } from "./pageviews-table";

interface PageviewsProps {
  organizationId: string;
  projectId: string;
}

export function Pageviews({ organizationId, projectId }: PageviewsProps) {
  const trpc = useTRPC();

  // Date range state using nuqs
  const [dateParams] = useQueryStates(
    {
      startDate: parseAsIsoDateTime,
      endDate: parseAsIsoDateTime,
    },
    {
      history: "push",
    },
  );

  const startDate = useMemo(() => {
    if (dateParams.startDate) return dateParams.startDate;
    if (!dateParams.endDate) return undefined;
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  }, [dateParams.startDate, dateParams.endDate]);

  const endDate = dateParams.endDate ?? undefined;

  // Get pageview stats using tRPC
  const { data: statsData, isLoading: statsLoading } = useQuery(
    trpc.pageview.getStats.queryOptions({
      projectId,
      organizationId,
      startDate,
      endDate,
    }),
  );

  return (
    <>
      {/* Header */}
      <PageHeader
        title="Pageviews"
        description={
          statsLoading
            ? "Loading pageviews..."
            : `${statsData?.totalViews || 0} total pageviews`
        }
      >
        <div className="flex items-center gap-2">
          <DateRangePicker />
        </div>
      </PageHeader>
      <div className="container mx-auto py-6 px-4 flex flex-col gap-4">
        {/* Stats Cards */}
        <Stats
          items={[
            {
              icon: Eye,
              name: "Total Pageviews",
              stat: statsData?.totalViews || 0,
            },
            {
              icon: Globe,
              name: "Unique Pages",
              stat: statsData?.uniquePages || 0,
            },
            {
              icon: Smartphone,
              name: "Mobile Views",
              stat: statsData?.mobileViews || 0,
            },
            {
              icon: Monitor,
              name: "Desktop Views",
              stat: statsData?.desktopViews || 0,
            },
          ]}
        />

        {/* Pageviews Chart */}
        <PageviewsChart organizationId={organizationId} projectId={projectId} />

        {/* Pageviews List */}
        <PageviewsTable organizationId={organizationId} projectId={projectId} />
      </div>
    </>
  );
}
