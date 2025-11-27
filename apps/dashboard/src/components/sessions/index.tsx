"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import { SankeyNivo } from "@bklit/ui/components/charts/sankey-nivo";
import { useQuery } from "@tanstack/react-query";
import { Clock, MapPin, Monitor } from "lucide-react";
import { parseAsIsoDateTime, useQueryStates } from "nuqs";
import { useMemo } from "react";
import { DateRangePicker } from "@/components/date-range-picker";
import { PageHeader } from "@/components/header/page-header";
import { Stats } from "@/components/stats";
import { useTRPC } from "@/trpc/react";
import {
  type SessionWithPageViews,
  transformSessionsToSankey,
  transformToNivoSankey,
} from "./sankey-utils";
import { SessionsChart } from "./sessions-chart";
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
  pageViewEvents: Array<{ url: string; timestamp: Date | string }>;
}

export function Sessions({ organizationId, projectId }: SessionsProps) {
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

  const sankeyData = useMemo(() => {
    if (!allSessions || allSessions.length === 0) {
      console.log("No sessions available for sankey chart");
      return { nodes: [], links: [] };
    }

    const sessionsWithPageViews = allSessions.filter(
      (s) => s.pageViewEvents && s.pageViewEvents.length > 0,
    );

    console.log("Raw sessions data:", {
      sessionCount: allSessions.length,
      sessionsWithPageViews: sessionsWithPageViews.length,
      firstSessionWithPages: sessionsWithPageViews[0]
        ? {
            id: sessionsWithPageViews[0].id,
            pageViewCount: sessionsWithPageViews[0].pageViewEvents?.length || 0,
            pageViews: sessionsWithPageViews[0].pageViewEvents?.map((pv) => ({
              url: pv.url,
              timestamp: pv.timestamp,
            })),
          }
        : null,
      samplePageViewEvents: sessionsWithPageViews.slice(0, 3).map((s) => ({
        sessionId: s.id,
        pageViewCount: s.pageViewEvents?.length || 0,
        paths: s.pageViewEvents?.map((pv) => {
          try {
            const urlObj = new URL(pv.url);
            return urlObj.pathname || "/";
          } catch {
            return pv.url;
          }
        }),
      })),
    });

    return transformSessionsToSankey(allSessions as SessionWithPageViews[]);
  }, [allSessions]);

  const nivoSankeyData = useMemo(() => {
    if (!sankeyData || sankeyData.nodes.length === 0) {
      return undefined;
    }
    return transformToNivoSankey(sankeyData);
  }, [sankeyData]);

  return (
    <>
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
      <div className="container mx-auto flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>User Journeys</CardTitle>
            <CardDescription>
              Flow of users through your site pages
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="h-[400px] flex items-center justify-center text-sm text-muted-foreground">
                Loading chart...
              </div>
            ) : !nivoSankeyData || nivoSankeyData.nodes.length === 0 ? (
              <div className="h-[400px] flex items-center justify-center text-sm text-muted-foreground">
                No data available
              </div>
            ) : (
              <SankeyNivo className="h-[500px]" data={nivoSankeyData} />
            )}
          </CardContent>
        </Card>
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
              stat: allSessions.filter((s) => !s.didBounce).length,
            },
            {
              icon: MapPin,
              name: "Bounced",
              stat: allSessions.filter((s) => s.didBounce).length,
            },
            {
              icon: Clock,
              name: "Avg Duration",
              stat: (() => {
                if (allSessions.length === 0) return 0;

                const avgSeconds =
                  allSessions.reduce(
                    (sum: number, s) => sum + (s.duration || 0),
                    0,
                  ) / allSessions.length;

                return avgSeconds < 60
                  ? Math.round(avgSeconds)
                  : Math.ceil(avgSeconds / 60);
              })(),
              suffix: (() => {
                if (allSessions.length === 0) return "s";

                const avgSeconds =
                  allSessions.reduce(
                    (sum: number, s) => sum + (s.duration || 0),
                    0,
                  ) / allSessions.length;

                return avgSeconds < 60 ? "s" : "m";
              })(),
            },
          ]}
        />
        <SessionsChart organizationId={organizationId} projectId={projectId} />
        <SessionsTable organizationId={organizationId} projectId={projectId} />
      </div>
    </>
  );
}
