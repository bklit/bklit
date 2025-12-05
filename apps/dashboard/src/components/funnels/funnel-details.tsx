"use client";

import { Badge } from "@bklit/ui/components/badge";
import { Button } from "@bklit/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import { Funnel as FunnelChart } from "@bklit/ui/components/charts/funnel";
import { Skeleton } from "@bklit/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@bklit/ui/components/table";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { PageHeader } from "@/components/header/page-header";
import { useTRPC } from "@/trpc/react";

interface FunnelDetailsProps {
  organizationId: string;
  projectId: string;
  funnelId: string;
}

export function FunnelDetails({
  organizationId,
  projectId,
  funnelId,
}: FunnelDetailsProps) {
  const trpc = useTRPC();

  const { data: funnel, isLoading: funnelLoading } = useQuery(
    trpc.funnel.getById.queryOptions({
      funnelId,
      projectId,
      organizationId,
    }),
  );

  const { data: stats, isLoading: statsLoading } = useQuery(
    trpc.funnel.getStats.queryOptions({
      funnelId,
      projectId,
      organizationId,
    }),
  );

  const isLoading = funnelLoading || statsLoading;

  // Transform funnel steps into chart data format
  const chartData = useMemo(() => {
    if (!funnel?.steps) return [];

    return funnel.steps.map((step) => {
      const stepStat = stats?.stepStats.find(
        (s) => s.stepId === step.id,
      );
      const conversions = stepStat?.conversions ?? 0;

      return {
        id: step.id,
        value: conversions,
        label: step.name,
      };
    });
  }, [funnel?.steps, stats?.stepStats]);

  if (isLoading) {
    return (
      <>
        <PageHeader
          title="Funnel Details"
          description="Loading funnel details..."
        />
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[400px] w-full" />
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (!funnel) {
    return (
      <>
        <PageHeader
          title="Funnel Not Found"
          description="The funnel you're looking for doesn't exist."
        />
        <div className="flex justify-center py-12">
          <Button asChild variant="outline">
            <Link href={`/${organizationId}/${projectId}/funnels`}>
              <ArrowLeft className="mr-2 size-4" />
              Back to Funnels
            </Link>
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={funnel.name}
        description={funnel.description || "Funnel details and analytics"}
        action={
          <Button asChild variant="outline">
            <Link href={`/${organizationId}/${projectId}/funnels`}>
              <ArrowLeft className="mr-2 size-4" />
              Back to Funnels
            </Link>
          </Button>
        }
      />

      <div className="space-y-6">
        {/* Funnel Overview Card */}
        <Card>
          <CardHeader>
            <CardTitle>Funnel Overview</CardTitle>
            <CardDescription>Basic information about this funnel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{funnel.name}</p>
              </div>
              {funnel.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="font-medium">{funnel.description}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">
                  {format(new Date(funnel.createdAt), "PPP")}
                </p>
              </div>
              {funnel.endDate && (
                <div>
                  <p className="text-sm text-muted-foreground">End Date</p>
                  <p className="font-medium">
                    {format(new Date(funnel.endDate), "PPP")}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Total Steps</p>
                <p className="font-medium">{funnel.steps.length}</p>
              </div>
              {stats && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Conversions
                  </p>
                  <p className="font-medium">{stats.totalConversions}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Funnel Chart */}
        {chartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Funnel Visualization</CardTitle>
              <CardDescription>
                Conversion flow through each step
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FunnelChart data={chartData} />
            </CardContent>
          </Card>
        )}

        {/* Steps Table */}
        <Card>
          <CardHeader>
            <CardTitle>Funnel Steps</CardTitle>
            <CardDescription>
              Detailed breakdown of each step in the funnel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>URL / Event</TableHead>
                  <TableHead>Conversions</TableHead>
                  <TableHead>Conversion Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {funnel.steps.map((step) => {
                  const stepStat = stats?.stepStats.find(
                    (s) => s.stepId === step.id,
                  );
                  const conversions = stepStat?.conversions ?? 0;
                  const conversionRate = stepStat?.conversionRate ?? 0;

                  return (
                    <TableRow key={step.id}>
                      <TableCell className="font-medium">
                        {step.stepOrder}
                      </TableCell>
                      <TableCell>{step.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {step.type === "pageview" ? "Pageview" : "Event"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {step.type === "pageview" ? (
                          <code className="text-xs">{step.url || "—"}</code>
                        ) : (
                          <code className="text-xs">
                            {step.eventName || "—"}
                          </code>
                        )}
                      </TableCell>
                      <TableCell>{conversions.toLocaleString()}</TableCell>
                      <TableCell>
                        {conversionRate > 0
                          ? `${conversionRate.toFixed(2)}%`
                          : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

