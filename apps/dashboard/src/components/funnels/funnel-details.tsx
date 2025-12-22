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
import { ProgressRow } from "@bklit/ui/components/progress-row";
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
import { parseAsIsoDateTime, useQueryStates } from "nuqs";
import { useEffect, useMemo } from "react";
import { DateRangePicker } from "@/components/date-range-picker";
import { PageHeader } from "@/components/header/page-header";
import { endOfDay, startOfDay } from "@/lib/date-utils";
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

  const [dateParams, setDateParams] = useQueryStates(
    {
      startDate: parseAsIsoDateTime,
      endDate: parseAsIsoDateTime,
    },
    {
      history: "push",
    }
  );

  const { data: funnel, isLoading: funnelLoading } = useQuery(
    trpc.funnel.getById.queryOptions({
      funnelId,
      projectId,
      organizationId,
    })
  );

  // Initialize date params based on funnel creation date
  useEffect(() => {
    if (!funnel?.createdAt) return;

    const thirtyDaysAgo = startOfDay(new Date());
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const creationDate = startOfDay(new Date(funnel.createdAt));
    const defaultEndDate = endOfDay(new Date());

    let defaultStartDate: Date;
    // If created more than 30 days ago, use 30 days ago
    if (creationDate < thirtyDaysAgo) {
      defaultStartDate = thirtyDaysAgo;
    } else {
      // Otherwise use creation date
      defaultStartDate = creationDate;
    }

    // Check if current dates match the DateRangePicker default (30 days ago)
    // or if dates are unset, initialize with our custom logic
    const currentStartDate = dateParams.startDate
      ? startOfDay(dateParams.startDate)
      : null;
    const isDefaultRange =
      currentStartDate &&
      currentStartDate.getTime() === thirtyDaysAgo.getTime();

    // Only update if dates are unset or match the default 30-day range
    // This allows our custom logic to override the DateRangePicker default
    if (
      (dateParams.startDate === null && dateParams.endDate === null) ||
      isDefaultRange
    ) {
      setDateParams({
        startDate: defaultStartDate,
        endDate: defaultEndDate,
      });
    }
  }, [
    funnel?.createdAt,
    dateParams.startDate,
    dateParams.endDate,
    setDateParams,
  ]);

  const startDate = dateParams.startDate ?? undefined;
  const endDate = dateParams.endDate ?? endOfDay(new Date());

  const { data: stats, isLoading: statsLoading } = useQuery(
    trpc.funnel.getStats.queryOptions({
      funnelId,
      projectId,
      organizationId,
      startDate,
      endDate,
    })
  );

  const isLoading = funnelLoading || statsLoading;

  const chartData = useMemo(() => {
    if (!funnel?.steps) return [];

    return funnel.steps.map((step) => {
      const stepStat = stats?.stepStats.find((s) => s.stepId === step.id);
      const conversions = stepStat?.conversions ?? 0;

      return {
        id: step.id,
        value: conversions,
        label: step.name,
      };
    });
  }, [funnel?.steps, stats?.stepStats]);

  const stepProgressData = useMemo(() => {
    if (!(funnel?.steps && stats?.stepStats)) return [];

    const chartColors = [
      "var(--chart-1)",
      "var(--chart-2)",
      "var(--chart-3)",
      "var(--chart-4)",
      "var(--chart-5)",
    ];

    const sortedSteps = [...funnel.steps].sort(
      (a, b) => a.stepOrder - b.stepOrder
    );

    return sortedSteps.map((step, index) => {
      const stepStat = stats.stepStats.find((s) => s.stepId === step.id);
      const conversions = stepStat?.conversions ?? 0;

      let percentage = 100;
      if (index > 0) {
        const previousStep = sortedSteps[index - 1];
        if (previousStep) {
          const previousStepStat = stats.stepStats.find(
            (s) => s.stepId === previousStep.id
          );
          const previousConversions = previousStepStat?.conversions ?? 0;
          if (previousConversions > 0) {
            percentage = (conversions / previousConversions) * 100;
          } else {
            percentage = 0;
          }
        }
      }

      const stepTypeLabel =
        step.type === "pageview"
          ? "Pageview"
          : step.eventName
            ? `Event: ${step.eventName}`
            : "Event";

      return {
        id: step.id,
        stepName: step.name,
        label: stepTypeLabel,
        value: conversions,
        percentage: Math.min(100, Math.max(0, percentage)),
        color: chartColors[index % chartColors.length] || chartColors[0],
      };
    });
  }, [funnel?.steps, stats?.stepStats]);

  if (isLoading) {
    return (
      <>
        <PageHeader
          description="Loading funnel details..."
          title="Funnel Details"
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
          description="The funnel you're looking for doesn't exist."
          title="Funnel Not Found"
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
        description={funnel.description || "Funnel details and analytics"}
        title={funnel.name}
      >
        <div className="flex items-center gap-2">
          <DateRangePicker />
          <Button asChild variant="outline">
            <Link href={`/${organizationId}/${projectId}/funnels`}>
              <ArrowLeft className="mr-2 size-4" />
              Back to Funnels
            </Link>
          </Button>
        </div>
      </PageHeader>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:grid sm:grid-cols-4">
          {/* Funnel Overview Card */}
          <div className="col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Funnel Overview</CardTitle>
                <CardDescription>
                  Basic information about this funnel
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {funnel.description && (
                  <div>
                    <p className="text-muted-foreground text-sm">Description</p>
                    <p className="font-medium">{funnel.description}</p>
                  </div>
                )}
                <div className="flex w-full items-center justify-between">
                  <p className="text-muted-foreground text-sm">Created</p>
                  <p className="font-medium text-sm">
                    {format(new Date(funnel.createdAt), "PPP")}
                  </p>
                </div>
                {funnel.endDate && (
                  <div className="flex w-full items-center justify-between">
                    <p className="text-muted-foreground text-sm">End Date</p>
                    <p className="font-medium text-sm">
                      {format(new Date(funnel.endDate), "PPP")}
                    </p>
                  </div>
                )}
                {stepProgressData.length > 0 && (
                  <div className="flex w-full flex-col space-y-4">
                    {stepProgressData.map((step) => (
                      <div className="flex flex-col" key={step.id}>
                        <div className="flex items-center justify-start gap-4 pb-3">
                          <div className="flex items-center gap-1.5">
                            <div
                              className="h-2 w-2 shrink-0 rounded-[2px]"
                              style={{ backgroundColor: step.color }}
                            />
                            <span className="font-medium text-xs">
                              {step.stepName}
                            </span>
                          </div>
                        </div>
                        <ProgressRow
                          color={step.color}
                          label={step.label}
                          percentage={step.percentage}
                          value={step.value}
                          variant="secondary"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {stats && (
                  <div className="flex w-full items-center justify-between">
                    <p className="text-muted-foreground text-sm">
                      Total Conversions
                    </p>
                    <div className="font-bold text-lg">
                      {stats.totalConversions}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Funnel Chart */}
          {chartData.length > 0 && (
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Funnel Visualization</CardTitle>
                <CardDescription>
                  Conversion flow through each step
                </CardDescription>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 && (
                  <div className="flex flex-wrap items-center justify-start gap-4 pb-3">
                    {chartData.map((step, index) => {
                      const chartColors = [
                        "bg-chart-1",
                        "bg-chart-2",
                        "bg-chart-3",
                        "bg-chart-4",
                        "bg-chart-5",
                      ];
                      const colorClass =
                        chartColors[index % chartColors.length] || "bg-chart-1";

                      return (
                        <div
                          className="flex items-center gap-1.5"
                          key={step.id}
                        >
                          <div
                            className={`h-2 w-2 shrink-0 rounded-[2px] ${colorClass}`}
                          />
                          <span className="font-medium text-xs">
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
                <FunnelChart data={chartData} />
              </CardContent>
            </Card>
          )}
        </div>

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
                    (s) => s.stepId === step.id
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
                        <Badge
                          size="lg"
                          variant={
                            step.type === "pageview" ? "default" : "alternative"
                          }
                        >
                          {step.type === "pageview" ? "Pageview" : "Event"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <Badge size="lg" variant="code">
                          {step.type === "pageview"
                            ? step.url || "—"
                            : step.eventName || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell>{conversions.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge
                          size="lg"
                          variant={
                            conversionRate > 30 ? "success" : "destructive"
                          }
                        >
                          {conversionRate > 0
                            ? conversionRate >= 99.995
                              ? "100%"
                              : `${conversionRate.toFixed(2)}%`
                            : "—"}
                        </Badge>
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
