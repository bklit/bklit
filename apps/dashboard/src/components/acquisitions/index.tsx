"use client";

import { useQuery } from "@tanstack/react-query";
import { CreditCard, Globe, MousePointer, Search, Share2 } from "lucide-react";
import { parseAsIsoDateTime, useQueryStates } from "nuqs";
import { useMemo } from "react";
import { DateRangePicker } from "@/components/date-range-picker";
import { PageHeader } from "@/components/header/page-header";
import { Stats } from "@/components/stats";
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

  const { data: statsData, isLoading: statsLoading } = useQuery(
    trpc.acquisition.getStats.queryOptions({
      projectId,
      organizationId,
      startDate,
      endDate,
    }),
  );

  return (
    <>
      <PageHeader
        title="Acquisitions"
        description={
          statsLoading
            ? "Loading acquisitions..."
            : `${statsData?.totalViews || 0} total views`
        }
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
            },
            {
              icon: MousePointer,
              name: "Direct Traffic",
              stat: statsData?.directTraffic || 0,
            },
            {
              icon: Search,
              name: "Organic Traffic",
              stat: statsData?.organicTraffic || 0,
            },
            {
              icon: Share2,
              name: "Social Traffic",
              stat: statsData?.socialTraffic || 0,
            },
            {
              icon: CreditCard,
              name: "Paid Traffic",
              stat: statsData?.paidTraffic || 0,
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
