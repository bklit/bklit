"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import { SankeyNivo } from "@bklit/ui/components/charts/sankey-nivo";
import { ProgressRow } from "@bklit/ui/components/progress-row";
import { Separator } from "@bklit/ui/components/separator";
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

  const { data: sessionsData, isLoading } = useQuery(
    trpc.session.getRecent.queryOptions({
      projectId,
      organizationId,
      limit: 1000,
      startDate,
      endDate,
    }),
  );

  const totalSessions = sessionsData?.totalCount || 0;
  const allSessions = sessionsData?.sessions || [];

  const sankeyData = useMemo(() => {
    if (!allSessions || allSessions.length === 0) {
      return { nodes: [], links: [] };
    }

    return transformSessionsToSankey(allSessions as SessionWithPageViews[]);
  }, [allSessions]);

  const nivoSankeyData = useMemo(() => {
    if (!sankeyData || sankeyData.nodes.length === 0) {
      return undefined;
    }
    return transformToNivoSankey(sankeyData);
  }, [sankeyData]);

  const { entryPoints, exitPoints } = useMemo(() => {
    if (!nivoSankeyData || !nivoSankeyData.links.length) {
      return { entryPoints: [], exitPoints: [] };
    }

    const incomingLinks = new Map<string, number>();
    const outgoingLinks = new Map<string, number>();
    const nodeValues = new Map<string, number>();

    nivoSankeyData.links.forEach((link) => {
      // Count incoming links
      incomingLinks.set(
        link.target,
        (incomingLinks.get(link.target) || 0) + link.value,
      );
      // Count outgoing links
      outgoingLinks.set(
        link.source,
        (outgoingLinks.get(link.source) || 0) + link.value,
      );
      // Track total value for each node
      nodeValues.set(
        link.source,
        (nodeValues.get(link.source) || 0) + link.value,
      );
      nodeValues.set(
        link.target,
        (nodeValues.get(link.target) || 0) + link.value,
      );
    });

    const entries: Array<{ id: string; value: number }> = [];
    const exits: Array<{ id: string; value: number }> = [];

    nivoSankeyData.nodes.forEach((node) => {
      const incoming = incomingLinks.get(node.id) || 0;
      const outgoing = outgoingLinks.get(node.id) || 0;

      if (incoming === 0 && outgoing > 0) {
        entries.push({ id: node.id, value: outgoing });
      } else if (outgoing === 0 && incoming > 0) {
        exits.push({ id: node.id, value: incoming });
      }
    });

    // Sort by value descending
    entries.sort((a, b) => b.value - a.value);
    exits.sort((a, b) => b.value - a.value);

    // Calculate percentages
    const totalEntryValue = entries.reduce((sum, e) => sum + e.value, 0);
    const totalExitValue = exits.reduce((sum, e) => sum + e.value, 0);

    const entryPoints = entries.map((entry) => ({
      id: entry.id,
      value: entry.value,
      percentage:
        totalEntryValue > 0 ? (entry.value / totalEntryValue) * 100 : 0,
    }));

    const exitPoints = exits.map((exit) => ({
      id: exit.id,
      value: exit.value,
      percentage: totalExitValue > 0 ? (exit.value / totalExitValue) * 100 : 0,
    }));

    return { entryPoints, exitPoints };
  }, [nivoSankeyData]);

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

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-3 flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Entry & Exit Points</CardTitle>
                <CardDescription>
                  Where users start and end their journeys
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="h-[400px] flex items-center justify-center text-sm text-muted-foreground">
                    Loading data...
                  </div>
                ) : !nivoSankeyData || nivoSankeyData.nodes.length === 0 ? (
                  <div className="h-[400px] flex items-center justify-center text-sm text-muted-foreground">
                    No data available
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col">
                      <div className="flex items-center justify-start gap-4 pb-3">
                        <div className="flex items-center gap-1.5">
                          <div className="h-2 w-2 shrink-0 rounded-[2px] bg-chart-2" />
                          <span className="text-xs font-medium">
                            Entry Points
                          </span>
                        </div>
                      </div>
                      {entryPoints.length > 0 ? (
                        entryPoints.map((entry) => (
                          <ProgressRow
                            key={entry.id}
                            label={entry.id}
                            value={entry.value}
                            percentage={entry.percentage}
                            color="var(--chart-2)"
                            variant="secondary"
                          />
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground py-2">
                          No entry points
                        </div>
                      )}
                    </div>
                    <Separator />
                    <div className="flex flex-col">
                      <div className="flex items-center justify-start gap-4 pb-3">
                        <div className="flex items-center gap-1.5">
                          <div className="h-2 w-2 shrink-0 rounded-[2px] bg-chart-3" />
                          <span className="text-xs font-medium">
                            Exit Points
                          </span>
                        </div>
                      </div>
                      {exitPoints.length > 0 ? (
                        exitPoints.map((exit) => (
                          <ProgressRow
                            key={exit.id}
                            label={exit.id}
                            value={exit.value}
                            percentage={exit.percentage}
                            color="var(--chart-3)"
                            variant="secondary"
                          />
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground py-2">
                          No exit points
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="col-span-9">
            <Card>
              <CardHeader>
                <CardTitle>User Journeys</CardTitle>
                <CardDescription>
                  Flow of users through your site pages
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-[400px] flex items-center justify-center text-sm text-muted-foreground">
                    Loading chart...
                  </div>
                ) : !nivoSankeyData || nivoSankeyData.nodes.length === 0 ? (
                  <div className="h-[400px] flex items-center justify-center text-sm text-muted-foreground">
                    No data available
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-start gap-4 pb-3">
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 shrink-0 rounded-[2px] bg-chart-2" />
                        <span className="text-xs font-medium">
                          Entry Points
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 shrink-0 rounded-[2px] bg-chart-1" />
                        <span className="text-xs font-medium">
                          Pass Through
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 shrink-0 rounded-[2px] bg-chart-3" />
                        <span className="text-xs font-medium">Exit Points</span>
                      </div>
                    </div>
                    <SankeyNivo
                      className="h-[400px]"
                      data={nivoSankeyData}
                      labelColor="auto"
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <SessionsChart organizationId={organizationId} projectId={projectId} />
        <SessionsTable organizationId={organizationId} projectId={projectId} />
      </div>
    </>
  );
}
