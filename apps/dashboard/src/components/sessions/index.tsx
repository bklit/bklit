"use client";

import { useQuery } from "@tanstack/react-query";
import { Clock, MapPin, Monitor } from "lucide-react";
import { parseAsIsoDateTime, useQueryStates } from "nuqs";
import { useMemo } from "react";
import { DateRangePicker } from "@/components/date-range-picker";
import { PageHeader } from "@/components/header/page-header";
import { Stats } from "@/components/stats";
import { useTRPC } from "@/trpc/react";
import { SessionsTable } from "./sessions-table";

interface SessionsProps {
  organizationId: string;
  projectId: string;
}

export interface Session {
  id: string;
  startedAt: string;
  didBounce: boolean;
  duration: number | null;
  userAgent: string | null;
  country: string | null;
  pageViewEvents: Array<unknown>;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "0s";

  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }

  return `${minutes}m ${remainingSeconds}s`;
}

export function Sessions({ organizationId, projectId }: SessionsProps) {
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

  // Get sessions using tRPC for stats
  const { data: sessionsData, isLoading } = useQuery(
    trpc.session.getRecent.queryOptions({
      projectId,
      organizationId,
      limit: 1000, // Get a large number for stats
      startDate,
      endDate,
    }),
  );

  const totalSessions = sessionsData?.totalCount || 0;
  const allSessions = sessionsData?.sessions || [];

  return (
    <>
      {/* Header */}
      <PageHeader
        title="Sessions"
        description={
          isLoading ? "Loading sessions..." : `${totalSessions} total sessions`
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
              icon: Clock,
              name: "Total Sessions",
              stat: totalSessions,
            },
            {
              icon: Monitor,
              name: "Engaged",
              stat: allSessions.filter((s: Session) => !s.didBounce).length,
            },
            {
              icon: MapPin,
              name: "Bounced",
              stat: allSessions.filter((s: Session) => s.didBounce).length,
            },
            {
              icon: Clock,
              name: "Avg Duration",
              stat:
                allSessions.length > 0
                  ? formatDuration(
                      Math.round(
                        allSessions.reduce(
                          (sum: number, s: Session) => sum + (s.duration || 0),
                          0,
                        ) / allSessions.length,
                      ),
                    )
                  : "0s",
            },
          ]}
        />

        {/* Sessions List */}
        <SessionsTable organizationId={organizationId} projectId={projectId} />
      </div>
    </>
  );
}
