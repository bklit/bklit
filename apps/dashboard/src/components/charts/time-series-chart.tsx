"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@bklit/ui/components/avatar";
import { Badge } from "@bklit/ui/components/badge";
import type { ChartConfig } from "@bklit/ui/components/chart";
import { ChartContainer, ChartTooltip } from "@bklit/ui/components/chart";
import { cn } from "@bklit/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
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

  // Fetch deployments for the date range
  const { data: deployments } = useQuery({
    ...trpc.deployment.listForProject.queryOptions({
      projectId,
      startDate,
      endDate,
    }),
    enabled: showDeployments && !!projectId,
  });

  // Group deployments by date
  const deploymentsByDate = useMemo(() => {
    if (!deployments) return new Map();

    const grouped = new Map<string, Array<(typeof deployments)[number]>>();
    for (const deployment of deployments) {
      const dateKey = new Date(deployment.deployedAt)
        .toISOString()
        .split("T")[0];
      if (!dateKey) continue;
      const existing = grouped.get(dateKey);
      if (existing) {
        existing.push(deployment);
      } else {
        grouped.set(dateKey, [deployment]);
      }
    }
    return grouped;
  }, [deployments]);

  // Render deployment marker label - just avatars, no separate tooltip
  const renderDeploymentLabel = (
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
    }>,
  ) => {
    const { viewBox } = props;
    const x = viewBox?.x ?? 0;
    const y = 10;

    const visibleCount = Math.min(3, deploymentsForDate.length);
    const remainingCount = deploymentsForDate.length - 3;
    const avatarSize = 20;
    const avatarSpacing = 14;

    return (
      <motion.g
        initial={{ opacity: 0, y: -15, scale: 0.9, filter: "blur(2px)" }}
        animate={{
          opacity: 1,
          y: [0, -4, 0], // Floating: start at 0, up 2px, back to 0
          scale: 1,
          filter: "blur(0px)",
        }}
        transition={{
          opacity: { duration: 0.4, delay: 0.5, ease: "easeOut" },
          scale: { duration: 0.4, delay: 0.5, ease: "easeOut" },
          filter: { duration: 0.4, delay: 0.5, ease: "easeOut" },
          y: {
            duration: 1.6,
            delay: 0.5,
            ease: "easeInOut",
            times: [0, 0.5, 1], // Control animation at 0%, 50%, 100%
            repeat: Number.POSITIVE_INFINITY, // Loop forever after initial animation
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
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0%" stopColor="var(--bklit-300)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="var(--bklit-300)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect
          x={x - 1.5}
          y={y + avatarSize}
          width={3}
          height={80}
          fill={`url(#deployment-gradient-${deploymentsForDate[0]?.id || "default"})`}
          rx={1.5}
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
                r={avatarSize / 2 + 1.5}
                fill="var(--bklit-300)"
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
                href={
                  deployment.authorAvatar ||
                  `https://github.com/${deployment.author}.png`
                }
                x={cx - avatarSize / 2 + 1}
                y={cy - avatarSize / 2 + 1}
                width={avatarSize - 2}
                height={avatarSize - 2}
                clipPath={`url(#clip-avatar-${deployment.id})`}
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
                  r={avatarSize / 2 + 1.5}
                  fill="var(--bklit-300)"
                  stroke="none"
                />
                <circle
                  cx={badgeCx}
                  cy={badgeCy}
                  r={avatarSize / 2}
                  fill="hsl(var(--muted))"
                  stroke="none"
                />
                <text
                  x={badgeCx}
                  y={badgeCy}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="10"
                  fontWeight="600"
                  fill="hsl(var(--muted-foreground))"
                  style={{ cursor: "pointer" }}
                >
                  +{remainingCount}
                </text>
              </g>
            );
          })()}
      </motion.g>
    );
  };

  // Custom tooltip content that includes deployments
  const CustomTooltipContent = ({ active, payload, label }: any) => {
    if (!active || !payload || !label) return null;

    // Get deployments for this date
    const dateKey = String(label); // This is the date string from the chart data
    const deploymentsForDate = deploymentsByDate.get(dateKey) || [];

    return (
      <div className="rounded-lg border bg-background p-3 shadow-xl z-900">
        {/* Date header */}
        <div className="mb-3 border-b pb-2">
          <p className="text-xs font-medium">
            {new Date(label).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Chart metrics */}
        <div className="space-y-2 mb-3">
          {payload.map(
            (entry: { dataKey: string; value: number; color: string }) => {
              const config = chartConfig[entry.dataKey];
              if (!config) return null;

              return (
                <div
                  key={entry.dataKey}
                  className="flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {config.label}
                    </span>
                  </div>
                  <span className="text-xs font-semibold">{entry.value}</span>
                </div>
              );
            },
          )}
        </div>

        {/* Deployments section */}
        {deploymentsForDate.length > 0 && (
          <div className="border-t pt-3 mt-3">
            <p className="text-xs font-semibold mb-2 flex items-center gap-1.5">
              {deploymentsForDate.length === 1
                ? "Deployment"
                : `${deploymentsForDate.length} Deployments`}
            </p>
            <div className="space-y-2.5">
              {deploymentsForDate
                .slice(0, 2)
                .map((deployment: (typeof deploymentsForDate)[number]) => {
                  const time = new Date(
                    deployment.deployedAt,
                  ).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  });
                  return (
                    <div key={deployment.id} className="space-y-1">
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
                        <span className="text-xs text-muted-foreground">
                          {time}
                        </span>
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5"
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
      <linearGradient key={key} id={`fill${key}`} x1="0" y1="0" x2="0" y2="1">
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
          key={key}
          dataKey={key}
          type="linear"
          fill={`url(#fill${key})`}
          stroke={`var(--color-${key})`}
          strokeWidth={2}
          dot={false}
          fillOpacity={shouldDim ? 0.1 : undefined}
          strokeOpacity={shouldDim ? 0.3 : undefined}
          activeDot={{
            r: 6,
            style: { fill: `var(--color-${key})`, opacity: 0.8 },
          }}
        />
      );
    });
  }, [chartConfig, hoverKey]);

  // Loading state
  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center bg-muted/50 rounded-lg animate-pulse"
        style={{ height }}
      >
        <p className="text-sm text-muted-foreground">Loading chart...</p>
      </div>
    );
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-muted/50 rounded-lg"
        style={{ height }}
      >
        <p className="text-sm text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <>
      <ChartContainer
        config={chartConfig}
        className="aspect-auto w-full overflow-visible"
        style={{ height }}
      >
        <AreaChart data={data} margin={{ left: 12, right: 12, top: 32 }}>
          <defs>
            {gradients}
            {/* Gradient for deployment reference lines */}
            <linearGradient
              id="deploymentLineGradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="hsl(var(--primary))"
                stopOpacity="0.8"
              />
              <stop
                offset="50%"
                stopColor="hsl(var(--primary))"
                stopOpacity="0.3"
              />
              <stop
                offset="100%"
                stopColor="hsl(var(--primary))"
                stopOpacity="0"
              />
            </linearGradient>
          </defs>

          <CartesianGrid
            stroke="var(--chart-cartesian)"
            strokeDasharray="5 5"
          />

          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={32}
            tickFormatter={(value) => {
              const date = new Date(value);
              return date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });
            }}
          />

          <ChartTooltip cursor={false} content={CustomTooltipContent} />

          {/* Deployment markers */}
          {showDeployments &&
            Array.from(deploymentsByDate.entries()).map(
              ([date, deploymentsForDate]) => (
                <ReferenceLine
                  key={date}
                  x={date}
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  strokeOpacity={0.3}
                  label={(props) =>
                    renderDeploymentLabel(props, deploymentsForDate)
                  }
                />
              ),
            )}

          {/* Render all areas */}
          {areas}
        </AreaChart>
      </ChartContainer>

      {/* Custom Legend */}
      {showLegend && (
        <div className="flex justify-center items-start mt-4">
          <div className="group flex items-center justify-center gap-0 flex-wrap">
            {Object.keys(chartConfig).map((key) => {
              const config = chartConfig[key];
              if (!config) return null;

              const isHovered = hoverKey === key;
              const shouldDim = hoverKey && !isHovered;

              return (
                <button
                  key={key}
                  type="button"
                  className={cn(
                    "flex items-center py-1 px-1.5 gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-all duration-100 group-has-[button:hover]:opacity-50 hover:opacity-100!",
                    shouldDim && "opacity-50",
                    isHovered && "opacity-100! text-foreground",
                  )}
                  onMouseEnter={() => setHoverKey(key)}
                  onMouseLeave={() => setHoverKey(undefined)}
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
    </>
  );
}
