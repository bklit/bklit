"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@bklit/ui/components/select";
import { useMediaQuery } from "@bklit/ui/hooks/use-media-query";
import { cn } from "@bklit/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Eye, Globe, ListFilter, Monitor, Smartphone } from "lucide-react";
import { parseAsIsoDateTime, parseAsString, useQueryStates } from "nuqs";
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

type ViewMode = "all" | "entry-points";

export function Pageviews({ organizationId, projectId }: PageviewsProps) {
  const trpc = useTRPC();
  const isDesktop = useMediaQuery("(min-width: 640px)");
  // Date range and view mode state using nuqs
  const [dateParams, setDateParams] = useQueryStates(
    {
      startDate: parseAsIsoDateTime,
      endDate: parseAsIsoDateTime,
      viewMode: parseAsString.withDefault("all"),
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
  const viewMode = dateParams.viewMode as ViewMode;

  // Get pageview stats using tRPC
  const { data: statsData, isLoading: statsLoading } = useQuery(
    trpc.pageview.getStats.queryOptions({
      projectId,
      organizationId,
      startDate,
      endDate,
    }),
  );

  // Get entry points data when in entry-points mode
  const { data: entryPointsData, isLoading: entryPointsLoading } = useQuery({
    ...trpc.pageview.getEntryPoints.queryOptions({
      projectId,
      organizationId,
      startDate,
      endDate,
    }),
    enabled: viewMode === "entry-points",
  });

  const isLoading =
    statsLoading || (viewMode === "entry-points" && entryPointsLoading);

  return (
    <>
      {/* Header */}
      <PageHeader
        title="Pageviews"
        description={
          isLoading
            ? "Loading pageviews..."
            : viewMode === "entry-points"
              ? `${entryPointsData?.entryPages?.length || 0} unique entry points`
              : `${statsData?.totalViews || 0} total pageviews`
        }
      >
        <div className="flex flex-row items-center gap-2 w-full justify-end">
          <DateRangePicker />
          <Select
            value={viewMode}
            onValueChange={(value) => setDateParams({ viewMode: value })}
          >
            <SelectTrigger
              size="sm"
              className={cn("w-auto", isDesktop && "w-full sm:w-[180px]")}
            >
              {isDesktop ? (
                <SelectValue placeholder="Select view mode" />
              ) : (
                <ListFilter size={16} />
              )}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Pageviews</SelectItem>
              <SelectItem value="entry-points">Entry Points</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </PageHeader>
      <div className="container mx-auto flex flex-col gap-4">
        {/* Stats Cards */}
        <Stats
          items={[
            {
              icon: Eye,
              name:
                viewMode === "entry-points"
                  ? "Entry Points"
                  : "Total Pageviews",
              stat:
                viewMode === "entry-points"
                  ? entryPointsData?.entryPages?.length || 0
                  : statsData?.totalViews || 0,
            },
            {
              icon: Globe,
              name: viewMode === "entry-points" ? "Sessions" : "Unique Pages",
              stat:
                viewMode === "entry-points"
                  ? entryPointsData?.entryPages?.reduce(
                      (sum, page) => sum + page.sessions,
                      0,
                    ) || 0
                  : statsData?.uniquePages || 0,
            },
            {
              icon: Smartphone,
              name: "Mobile Views",
              stat:
                viewMode === "entry-points"
                  ? entryPointsData?.entryPages?.reduce(
                      (sum, page) => sum + page.mobileSessions,
                      0,
                    ) || 0
                  : statsData?.mobileViews || 0,
            },
            {
              icon: Monitor,
              name: "Desktop Views",
              stat:
                viewMode === "entry-points"
                  ? entryPointsData?.entryPages?.reduce(
                      (sum, page) => sum + page.desktopSessions,
                      0,
                    ) || 0
                  : statsData?.desktopViews || 0,
            },
          ]}
        />

        {/* Pageviews Chart */}
        <PageviewsChart
          organizationId={organizationId}
          projectId={projectId}
          viewMode={viewMode}
        />

        {/* Pageviews List */}
        <PageviewsTable
          organizationId={organizationId}
          projectId={projectId}
          viewMode={viewMode}
        />
      </div>
    </>
  );
}
