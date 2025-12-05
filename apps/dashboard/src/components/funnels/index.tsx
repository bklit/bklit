"use client";

import { Button } from "@bklit/ui/components/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { parseAsInteger, parseAsIsoDateTime, useQueryStates } from "nuqs";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { DateRangePicker } from "@/components/date-range-picker";
import { PageHeader } from "@/components/header/page-header";
import { Stats } from "@/components/stats";
import { useTRPC } from "@/trpc/react";
import { FunnelsTable } from "./funnels-table";

interface FunnelsProps {
  organizationId: string;
  projectId: string;
}

export function Funnels({ organizationId, projectId }: FunnelsProps) {
  // Date range state using nuqs
  const [dateParams, setDateParams] = useQueryStates(
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

  return (
    <>
      <PageHeader
        title="Funnels"
        description="Track and analyze conversion funnels"
        action={
          <Button asChild>
            <Link href={`/${organizationId}/${projectId}/funnels/builder`}>
              <Plus className="mr-2 size-4" />
              Create Funnel
            </Link>
          </Button>
        }
      />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <DateRangePicker
            startDate={dateParams.startDate}
            endDate={dateParams.endDate}
            onStartDateChange={(date) => {
              setDateParams({ startDate: date });
              setPaginationParams({ page: 1 });
            }}
            onEndDateChange={(date) => {
              setDateParams({ endDate: date });
              setPaginationParams({ page: 1 });
            }}
          />
        </div>

        <Stats
          items={[
            {
              label: "Total Funnels",
              value: data?.totalCount ?? 0,
              icon: "chart",
            },
          ]}
        />

        <FunnelsTable
          organizationId={organizationId}
          projectId={projectId}
          funnels={data?.funnels ?? []}
          isLoading={isLoading}
          pagination={data?.pagination}
          onPageChange={(page) => setPaginationParams({ page })}
        />
      </div>
    </>
  );
}

