"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@bklit/ui/components/avatar";
import { Badge } from "@bklit/ui/components/badge";
import { Button } from "@bklit/ui/components/button";
import type { ChartConfig } from "@bklit/ui/components/chart";
import { ChartContainer, ChartTooltip } from "@bklit/ui/components/chart";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@bklit/ui/components/dialog";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemMedia,
  ItemTitle,
} from "@bklit/ui/components/item";
// import { GitHubIcon } from "@bklit/ui/icons/github";
import { cn } from "@bklit/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { GitCommitHorizontal } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useMemo, useRef, useState } from "react";
import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis } from "recharts";
import { useTRPC } from "@/trpc/react";

interface TimeSeriesData {
  date: string;
  [key: string]: string | number;
}

interface TimeSeriesChartProps {
  /** Project ID for fetching deployments */
  projectId: string;
  /** Time series data with date and metric keys */
  data: TimeSeriesData[];
  /** Chart configuration defining colors and labels for each metric */
  chartConfig: ChartConfig;
  /** Whether to show deployment markers (default: true) */
  showDeployments?: boolean;
  /** Chart height in pixels (default: 250) */
  height?: number;
  /** Loading state */
  isLoading?: boolean;
  /** Date range for filtering deployments */
  startDate?: Date;
  endDate?: Date;
  /** Show legend (default: true) */
  showLegend?: boolean;
}

export function TimeSeriesChart({
  projectId,
  data,
  chartConfig,
  showDeployments = true,
  height = 250,
  isLoading,
  startDate,
  endDate,
  showLegend = true,
}: TimeSeriesChartProps) {
  const trpc = useTRPC();
  const [hoverKey, setHoverKey] = useState<string | undefined>();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const hasAnimatedIn = useRef(new Set<string>());

  // Check if project has deployment tracking extensions enabled
  const { data: projectExtensions } = useQuery({
    ...trpc.extension.listForProject.queryOptions({
      projectId,
    }),
    enabled: !!projectId,
  });

  // Only show deployments if GitHub or Vercel extension is enabled
  const hasDeploymentExtension = useMemo(() => {
    if (!projectExtensions) {
      return false;
    }
    return projectExtensions.some(
      (ext) =>
        (ext.extensionId === "github" || ext.extensionId === "vercel") &&
        ext.enabled === true
    );
  }, [projectExtensions]);

  // Fetch deployments for the date range
  const { data: deployments } = useQuery({
    ...trpc.deployment.listForProject.queryOptions({
      projectId,
      startDate,
      endDate,
    }),
    enabled: showDeployments && hasDeploymentExtension && !!projectId,
  });

  // Group deployments by date
  const deploymentsByDate = useMemo(() => {
    if (!deployments) {
      return new Map();
    }

    const grouped = new Map<string, (typeof deployments)[number][]>();
    for (const deployment of deployments) {
      const dateKey = new Date(deployment.deployedAt)
        .toISOString()
        .split("T")[0];
      if (!dateKey) {
        continue;
      }
      const existing = grouped.get(dateKey);
      if (existing) {
        existing.push(deployment);
      } else {
        grouped.set(dateKey, [deployment]);
      }
    }
    return grouped;
  }, [deployments]);

  // Render deployment marker label - memoized to prevent re-renders on legend hover
  const renderDeploymentLabel = useCallback(
    (
      props: {
        viewBox?: { x?: number; y?: number; width?: number; height?: number };
      },
      deploymentsForDate: Array<{
        id: string;
        deployedAt: Date;
        commitSha: string;
        commitMessage: string;
        author: string;
        authorAvatar: string | null;
        platform: string;
        status: string;
        githubRepository?: string | null;
      }>,
      dateKey: string
    ) => {
      const { viewBox } = props;
      const x = viewBox?.x ?? 0;
      const y = 10;

      const visibleCount = Math.min(3, deploymentsForDate.length);
      const remainingCount = deploymentsForDate.length - 3;
      const avatarSize = 20;
      const avatarSpacing = 14;

      // Check if this marker has animated in before
      const hasAnimated = hasAnimatedIn.current.has(dateKey);
      if (!hasAnimated) {
        hasAnimatedIn.current.add(dateKey);
      }

      return (
        <motion.g
          animate={{
            opacity: 1,
            y: [0, -4, 0],
            scale: 1,
            filter: "blur(0px)",
          }}
          initial={
            hasAnimated
              ? false
              : { opacity: 0, y: -15, scale: 0.9, filter: "blur(2px)" }
          }
          key={`deployment-marker-${dateKey}`}
          transition={{
            opacity: hasAnimated
              ? {}
              : { duration: 0.4, delay: 0.5, ease: "easeOut" },
            scale: hasAnimated
              ? {}
              : { duration: 0.4, delay: 0.5, ease: "easeOut" },
            filter: hasAnimated
              ? {}
              : { duration: 0.4, delay: 0.5, ease: "easeOut" },
            y: {
              duration: 1.6,
              delay: hasAnimated ? 0 : 0.9,
              ease: "easeInOut",
              times: [0, 0.5, 1],
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
              repeatDelay: 0,
            },
          }}
        >
          {/* Vertical gradient rectangle below avatars */}
          <defs>
            <linearGradient
              id={`deployment-gradient-${deploymentsForDate[0]?.id || "default"}`}
              x1="0"
              x2="0"
              y1="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="var(--bklit-300)"
                stopOpacity="0.8"
              />
              <stop
                offset="100%"
                stopColor="var(--bklit-300)"
                stopOpacity="0"
              />
            </linearGradient>
          </defs>
          <rect
            fill={`url(#deployment-gradient-${deploymentsForDate[0]?.id || "default"})`}
            height={80}
            rx={1.5}
            width={3}
            x={x - 1.5}
            y={y + avatarSize}
          />

          {/* Avatar circles */}
          {deploymentsForDate.slice(0, 3).map((deployment, idx) => {
            // Center the entire group of avatars over the reference line
            const totalGroupWidth = (visibleCount - 1) * avatarSpacing;
            const groupStartX = x - totalGroupWidth / 2;
            const cx = groupStartX + idx * avatarSpacing;
            const cy = y + avatarSize / 2;

            return (
              <g key={deployment.id}>
                {/* Bklit-500 border circle */}
                <circle
                  cx={cx}
                  cy={cy}
                  fill="var(--bklit-300)"
                  r={avatarSize / 2 + 1.5}
                  stroke="none"
                />

                {/* Clip path for circular avatar */}
                <defs>
                  <clipPath id={`clip-avatar-${deployment.id}`}>
                    <circle cx={cx} cy={cy} r={avatarSize / 2 - 1} />
                  </clipPath>
                </defs>

                {/* Avatar image */}
                <image
                  clipPath={`url(#clip-avatar-${deployment.id})`}
                  height={avatarSize - 2}
                  href={
                    deployment.authorAvatar ||
                    `https://github.com/${deployment.author}.png`
                  }
                  style={{ cursor: "pointer" }}
                  width={avatarSize - 2}
                  x={cx - avatarSize / 2 + 1}
                  y={cy - avatarSize / 2 + 1}
                />
                {/* Invisible click area for avatar */}
                <circle
                  cx={cx}
                  cy={cy}
                  fill="transparent"
                  onPointerDown={() => setSelectedDate(dateKey)}
                  r={avatarSize / 2}
                  style={{ cursor: "pointer" }}
                />
              </g>
            );
          })}

          {/* +N badge if more than 3 deployments */}
          {remainingCount > 0 &&
            (() => {
              const totalGroupWidth = (visibleCount - 1) * avatarSpacing;
              const groupStartX = x - totalGroupWidth / 2;
              const badgeCx = groupStartX + visibleCount * avatarSpacing;
              const badgeCy = y + avatarSize / 2;

              return (
                <g>
                  <circle
                    cx={badgeCx}
                    cy={badgeCy}
                    fill="var(--bklit-300)"
                    r={avatarSize / 2 + 1.5}
                    stroke="none"
                  />
                  <circle
                    cx={badgeCx}
                    cy={badgeCy}
                    fill="hsl(var(--muted))"
                    r={avatarSize / 2}
                    stroke="none"
                  />
                  <text
                    dominantBaseline="central"
                    fill="hsl(var(--muted-foreground))"
                    fontSize="10"
                    fontWeight="600"
                    style={{ cursor: "pointer", pointerEvents: "none" }}
                    textAnchor="middle"
                    x={badgeCx}
                    y={badgeCy}
                  >
                    +{remainingCount}
                  </text>
                  {/* Invisible click area for badge */}
                  <circle
                    cx={badgeCx}
                    cy={badgeCy}
                    fill="transparent"
                    onPointerDown={() => setSelectedDate(dateKey)}
                    r={avatarSize / 2}
                    style={{ cursor: "pointer" }}
                  />
                </g>
              );
            })()}
        </motion.g>
      );
    },
    []
  );

  // Custom tooltip content that includes deployments
  const CustomTooltipContent = ({ active, payload, label }: any) => {
    if (!(active && payload && label)) {
      return null;
    }

    // Get deployments for this date
    const dateKey = String(label); // This is the date string from the chart data
    const deploymentsForDate = deploymentsByDate.get(dateKey) || [];

    return (
      <div className="z-900 rounded-lg border bg-background p-3 shadow-xl">
        {/* Date header */}
        <div className="mb-3 border-b pb-2">
          <p className="font-medium text-xs">
            {new Date(label).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Chart metrics */}
        <div className="mb-3 space-y-2">
          {payload.map(
            (entry: { dataKey: string; value: number; color: string }) => {
              const config = chartConfig[entry.dataKey];
              if (!config) {
                return null;
              }

              return (
                <div
                  className="flex items-center justify-between gap-4"
                  key={entry.dataKey}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-muted-foreground text-xs">
                      {config.label}
                    </span>
                  </div>
                  <span className="font-semibold text-xs">{entry.value}</span>
                </div>
              );
            }
          )}
        </div>

        {/* Deployments section */}
        {deploymentsForDate.length > 0 && (
          <div className="mt-3 border-t pt-3">
            <p className="mb-2 flex items-center gap-1.5 font-semibold text-xs">
              {deploymentsForDate.length === 1
                ? "Deployment"
                : `${deploymentsForDate.length} Deployments`}
            </p>
            <div className="space-y-2.5">
              {deploymentsForDate
                .slice(0, 2)
                .map((deployment: (typeof deploymentsForDate)[number]) => {
                  const time = new Date(
                    deployment.deployedAt
                  ).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  });
                  return (
                    <div className="space-y-1" key={deployment.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="size-4">
                          <AvatarImage
                            src={
                              deployment.authorAvatar ||
                              `https://github.com/${deployment.author}.png`
                            }
                          />
                          <AvatarFallback className="text-[8px]">
                            {deployment.author[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-muted-foreground text-xs">
                          {time}
                        </span>
                        <Badge
                          className="px-1.5 text-[10px]"
                          variant="secondary"
                        >
                          {deployment.platform}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Auto-generate gradients from chartConfig
  const gradients = useMemo(() => {
    return Object.keys(chartConfig).map((key) => (
      <linearGradient id={`fill${key}`} key={key} x1="0" x2="0" y1="0" y2="1">
        <stop offset="5%" stopColor={`var(--color-${key})`} stopOpacity={0.8} />
        <stop
          offset="95%"
          stopColor={`var(--color-${key})`}
          stopOpacity={0.1}
        />
      </linearGradient>
    ));
  }, [chartConfig]);

  // Auto-generate Area components from chartConfig with hover support
  const areas = useMemo(() => {
    return Object.keys(chartConfig).map((key) => {
      const isHovered = hoverKey === key;
      const shouldDim = hoverKey && !isHovered;

      return (
        <Area
          activeDot={{
            r: 6,
            style: { fill: `var(--color-${key})`, opacity: 0.8 },
          }}
          dataKey={key}
          dot={false}
          fill={`url(#fill${key})`}
          fillOpacity={shouldDim ? 0.1 : undefined}
          key={key}
          stroke={`var(--color-${key})`}
          strokeOpacity={shouldDim ? 0.3 : undefined}
          strokeWidth={2}
          style={{
            transition:
              "fill-opacity 0.18s ease-in-out, stroke-opacity 0.18s ease-in-out",
          }}
          type="linear"
        />
      );
    });
  }, [chartConfig, hoverKey]);

  // Loading state
  if (isLoading) {
    return (
      <div
        className="flex animate-pulse items-center justify-center rounded-lg bg-muted/50"
        style={{ height }}
      >
        <p className="text-muted-foreground text-sm">Loading chart...</p>
      </div>
    );
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-lg bg-muted/50"
        style={{ height }}
      >
        <p className="text-muted-foreground text-sm">No data available</p>
      </div>
    );
  }

  return (
    <>
      <ChartContainer
        className="aspect-auto w-full overflow-visible"
        config={chartConfig}
        style={{ height }}
      >
        <AreaChart data={data} margin={{ left: 12, right: 12, top: 32 }}>
          <defs>{gradients}</defs>

          <CartesianGrid
            stroke="var(--chart-cartesian)"
            strokeDasharray="5 5"
          />

          <XAxis
            axisLine={false}
            dataKey="date"
            minTickGap={32}
            tickFormatter={(value) => {
              const date = new Date(value);
              return date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });
            }}
            tickLine={false}
            tickMargin={8}
          />

          <ChartTooltip content={CustomTooltipContent} cursor={false} />

          {/* Deployment markers */}
          {showDeployments &&
            Array.from(deploymentsByDate.entries()).map(
              ([date, deploymentsForDate]) => (
                <ReferenceLine
                  key={date}
                  label={(props) =>
                    renderDeploymentLabel(props, deploymentsForDate, date)
                  }
                  stroke="none"
                  x={date}
                />
              )
            )}

          {/* Render all areas */}
          {areas}
        </AreaChart>
      </ChartContainer>

      {/* Custom Legend */}
      {showLegend && (
        <div className="mt-4 flex items-start justify-center">
          <div className="group flex flex-wrap items-center justify-center gap-0">
            {Object.keys(chartConfig).map((key) => {
              const config = chartConfig[key];
              if (!config) {
                return null;
              }

              const isHovered = hoverKey === key;
              const shouldDim = hoverKey && !isHovered;

              return (
                <button
                  className={cn(
                    "flex items-center gap-1.5 px-1.5 py-1 text-muted-foreground text-sm transition-all duration-100 hover:text-foreground hover:opacity-100! group-has-[button:hover]:opacity-50",
                    shouldDim && "opacity-50",
                    isHovered && "text-foreground opacity-100!"
                  )}
                  key={key}
                  onMouseEnter={() => setHoverKey(key)}
                  onMouseLeave={() => setHoverKey(undefined)}
                  type="button"
                >
                  <div
                    className="size-2 shrink-0 rounded-[2px]"
                    style={{
                      backgroundColor: config.color || `var(--color-${key})`,
                    }}
                  />
                  <span className="capitalize">{config.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Deployments Dialog */}
      <Dialog onOpenChange={() => setSelectedDate(null)} open={!!selectedDate}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Deployments on{" "}
              {selectedDate &&
                new Date(selectedDate).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
            </DialogTitle>
            <DialogDescription>
              {selectedDate && deploymentsByDate.get(selectedDate)?.length}{" "}
              deployment
              {selectedDate && deploymentsByDate.get(selectedDate)?.length !== 1
                ? "s"
                : ""}{" "}
              on this day
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-96 space-y-3 overflow-y-auto">
            {selectedDate &&
              deploymentsByDate
                .get(selectedDate)
                ?.map(
                  (deployment: {
                    id: string;
                    deployedAt: Date;
                    commitSha: string;
                    commitMessage: string;
                    author: string;
                    authorAvatar: string | null;
                    platform: string;
                    status: string;
                    deploymentUrl?: string | null;
                    githubRepository?: string | null;
                  }) => {
                    const time = new Date(
                      deployment.deployedAt
                    ).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    });

                    return (
                      <Item key={deployment.id} size="sm" variant="outline">
                        <ItemMedia>
                          <Avatar className="mt-1 size-10">
                            <AvatarImage
                              src={
                                deployment.authorAvatar ||
                                `https://github.com/${deployment.author}.png`
                              }
                            />
                            <AvatarFallback>
                              {deployment.author[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </ItemMedia>
                        <ItemContent>
                          <ItemTitle>
                            <Badge variant="code">{time}</Badge>
                            <Badge variant="secondary">
                              {deployment.platform}
                            </Badge>
                            {deployment.status === "success" && (
                              <Badge className="gap-1.5" variant="secondary">
                                <span className="size-2 rounded-full bg-teal-500" />
                                Deployed
                              </Badge>
                            )}
                          </ItemTitle>
                        </ItemContent>
                        <ItemActions>
                          {deployment.githubRepository && (
                            <Button
                              asChild
                              className="text-xs"
                              size="sm"
                              variant="outline"
                            >
                              <a
                                href={`https://github.com/${deployment.githubRepository}/commit/${deployment.commitSha}`}
                                rel="noopener noreferrer"
                                target="_blank"
                              >
                                <GitCommitHorizontal className="size-3" />{" "}
                                {deployment.commitSha.slice(0, 7)}
                              </a>
                            </Button>
                          )}
                        </ItemActions>
                      </Item>
                    );
                  }
                )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
