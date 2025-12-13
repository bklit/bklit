"use client";

import { Button } from "@bklit/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import { ProgressRow } from "@bklit/ui/components/progress-row";
import { Separator } from "@bklit/ui/components/separator";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import Link from "next/link";
import { parseAsInteger, parseAsIsoDateTime, useQueryStates } from "nuqs";
import { useMemo } from "react";
import { DateRangePicker } from "@/components/date-range-picker";
import { PageHeader } from "@/components/header/page-header";
import { SubNavigation } from "@/components/navigation/sub-navigation";
import { useTRPC } from "@/trpc/react";
import { FunnelsChart } from "./funnels-chart";
import { FunnelsList } from "./funnels-list";

interface FunnelsProps {
  organizationId: string;
  projectId: string;
}

export function Funnels({ organizationId, projectId }: FunnelsProps) {
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

  // Pagination state
  const [paginationParams, setPaginationParams] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      limit: parseAsInteger.withDefault(20),
    },
    {
      history: "push",
    },
  );

  const trpc = useTRPC();

  const { data, isLoading } = useQuery(
    trpc.funnel.list.queryOptions({
      projectId,
      organizationId,
      page: paginationParams.page,
      limit: paginationParams.limit,
      startDate,
      endDate,
    }),
  );

  // Fetch stats for all funnels to show conversion percentages
  const funnelStatsQueries = useQueries({
    queries: (data?.funnels ?? []).map((funnel) =>
      trpc.funnel.getStats.queryOptions({
        funnelId: funnel.id,
        projectId,
        organizationId,
        startDate,
        endDate,
      }),
    ),
  });

  // Prepare conversion data for the card
  const conversionData = useMemo(() => {
    if (!data?.funnels) return [];

    return data.funnels
      .map((funnel, index) => {
        const stats = funnelStatsQueries[index]?.data;
        return {
          id: funnel.id,
          name: funnel.name,
          conversionRate: stats?.overallConversionRate ?? 0,
        };
      })
      .sort((a, b) => b.conversionRate - a.conversionRate);
  }, [data?.funnels, funnelStatsQueries]);

  return (
    <>
      <PageHeader
        title="Funnels"
        description="Track and analyze conversion funnels"
      >
        <div className="flex items-center gap-2">
          <SubNavigation
            configKey="funnelNavigation"
            organizationId={organizationId}
            projectId={projectId}
          />
          <DateRangePicker />
          <Button asChild>
            <Link href={`/${organizationId}/${projectId}/funnels/builder`}>
              <Plus className="mr-2 size-4" />
              Create Funnel
            </Link>
          </Button>
        </div>
      </PageHeader>

      <div className="container mx-auto flex flex-col gap-4">
        <div className="flex flex-col sm:grid sm:grid-cols-12 gap-4">
          <div className="col-span-3 flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Conversion Rates</CardTitle>
                <CardDescription>
                  Overall conversion percentage for each funnel
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="h-[400px] flex items-center justify-center text-sm text-muted-foreground">
                    Loading data...
                  </div>
                ) : conversionData.length === 0 ? (
                  <div className="h-[400px] flex items-center justify-center text-sm text-muted-foreground">
                    No funnels available
                  </div>
                ) : (
                  <div className="flex flex-col">
                    <div className="flex items-center justify-start gap-4 pb-3">
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 shrink-0 rounded-[2px] bg-chart-2" />
                        <span className="text-xs font-medium">Funnels</span>
                      </div>
                    </div>
                    {conversionData.map((funnel) => (
                      <ProgressRow
                        key={funnel.id}
                        label={funnel.name}
                        value={funnel.conversionRate}
                        percentage={funnel.conversionRate}
                        color="var(--chart-2)"
                        variant="secondary"
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="col-span-9">
            <FunnelsChart
              organizationId={organizationId}
              projectId={projectId}
            />
          </div>
        </div>

        <FunnelsList
          organizationId={organizationId}
          projectId={projectId}
          funnels={data?.funnels ?? []}
          isLoading={isLoading}
          totalCount={data?.totalCount}
          pagination={data?.pagination}
          onPageChange={(page) => setPaginationParams({ page })}
        />
      </div>
    </>
  );
}
