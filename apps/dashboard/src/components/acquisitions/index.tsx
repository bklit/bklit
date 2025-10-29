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
          <div className="flex gap-2 ml-4">
            <a
              href="http://localhost:5173/?utm_source=google&utm_medium=cpc&utm_campaign=test-campaign"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              🧪 Test UTM Link
            </a>
            <a
              href="http://localhost:5173/?utm_source=facebook&utm_medium=social&utm_campaign=brand-awareness"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm font-medium bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            >
              📱 Test Social UTM
            </a>
            <a
              href="http://localhost:5173/?utm_source=newsletter&utm_medium=email&utm_campaign=weekly-update"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm font-medium bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
            >
              📧 Test Email UTM
            </a>
          </div>
        </div>
      </PageHeader>
      <div className="container mx-auto py-6 px-4 flex flex-col gap-4">
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
        {/* Test Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">
            🧪 Test Acquisition Data
          </h3>
          <p className="text-sm text-blue-700 mb-2">
            Click the test links above to generate pageviews with UTM
            parameters, or visit your site from external sites to test referrer
            tracking.
          </p>
          <p className="text-xs text-blue-600">
            <strong>For referrer testing:</strong> Open your site in a new tab,
            then visit from Google, Facebook, or other sites to see referrer
            data.
          </p>
        </div>

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
