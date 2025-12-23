"use client";

import { cn } from "@bklit/ui/lib/utils";
import NumberFlow from "@number-flow/react";
import { useEffect, useId, useMemo, useState } from "react";
import { Cell, Pie, PieChart, Sector } from "recharts";
import type { PieSectorDataItem } from "recharts/types/polar/Pie";
import { type ChartConfig, ChartContainer } from "../chart";

type PieDatum = { name: string; value: number; label?: string };

interface PieDonutProps {
  data: PieDatum[];
  title?: string;
  description?: string;
  innerRadius?: number;
  outerRadius?: number;
  showLegend?: boolean;
  variant?: "default" | "positive-negative";
  colors?: Record<string, string>;
  centerLabel?: { showTotal?: boolean; suffix?: string };
  className?: string;
}

export function PieDonut({
  data,
  innerRadius = 70,
  outerRadius = 100,
  showLegend = true,
  variant = "default",
  colors,
  centerLabel = { showTotal: true, suffix: "" },
  className,
}: PieDonutProps) {
  const [hoverKey, setHoverKey] = useState<string | undefined>(undefined);
  const chartId = useId().replace(/:/g, "");
  const [displayValue, setDisplayValue] = useState<number>(0);

  const total = useMemo(
    () => data.reduce((acc, d) => acc + (Number(d.value) || 0), 0),
    [data],
  );

  // Calculate active index based on hoverKey
  const activeIndex = useMemo(() => {
    if (!hoverKey) return undefined;
    const index = data.findIndex((d) => d.name === hoverKey);
    return index >= 0 ? index : undefined;
  }, [hoverKey, data]);

  // Initialize displayValue with total
  useEffect(() => {
    setDisplayValue(total);
  }, [total]);

  const resolvedColors = useMemo(() => {
    if (colors) return colors;
    // Assign shadcn chart-1..9 by order; for positive-negative, use --chart-1 and --chart-negative
    const map: Record<string, string> = {};
    if (variant === "positive-negative" && data.length >= 2) {
      const first = data[0]?.name;
      const second = data[1]?.name;
      if (first) map[first] = "var(--chart-1)";
      if (second) map[second] = "var(--chart-negative)";
      for (let i = 2; i < data.length; i++) {
        const key = data[i]?.name;
        if (key) map[key] = `var(--chart-${((i % 9) + 1) as number})`;
      }
      return map;
    }
    data.forEach((d, idx) => {
      map[d.name] = `var(--chart-${((idx % 9) + 1) as number})`;
    });
    return map;
  }, [colors, data, variant]);

  const chartConfig: ChartConfig = useMemo(() => {
    const config: ChartConfig = {};
    data.forEach((d) => {
      config[d.name] = {
        label: d.label ?? d.name,
        color: resolvedColors[d.name],
      };
    });
    return config;
  }, [data, resolvedColors]);

  const onLegendEnter = (value?: string) => {
    setHoverKey(value);
    if (value) {
      const hovered = data.find((d) => d.name === value);
      if (hovered && total > 0) {
        setDisplayValue(Math.round((hovered.value / total) * 100));
      }
    } else {
      setDisplayValue(total);
    }
  };

  const onLegendLeave = () => {
    setHoverKey(undefined);
    setDisplayValue(total);
  };

  // Calculate the suffix to display
  const displaySuffix = useMemo(() => {
    if (hoverKey) {
      return "%";
    }
    return "";
  }, [hoverKey]);

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-1 grid-rows-1 mx-auto justify-center items-center">
        {/* Chart */}
        <div className="col-start-1 row-start-1 flex justify-center items-center">
          <ChartContainer
            id={chartId}
            config={chartConfig}
            className={cn("w-full h-[220px]", className)}
          >
            <PieChart accessibilityLayer>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                strokeWidth={0}
                {...({
                  activeIndex: activeIndex ?? -1,
                  shape: (
                    props: PieSectorDataItem & { isActive?: boolean },
                  ) => {
                    const radius = props.isActive
                      ? (props.outerRadius ?? outerRadius) + 10
                      : (props.outerRadius ?? outerRadius);
                    return <Sector {...props} outerRadius={radius} />;
                  },
                } as Record<string, unknown>)}
                onMouseLeave={() => {
                  setHoverKey(undefined);
                  setDisplayValue(total);
                }}
                onMouseEnter={(payload: { name?: string }) => {
                  const name = payload?.name;
                  if (name) {
                    setHoverKey(name);
                    const hovered = data.find((d) => d.name === name);
                    if (hovered && total > 0) {
                      setDisplayValue(
                        Math.round((hovered.value / total) * 100),
                      );
                    }
                  }
                }}
                onMouseMove={(_: unknown, index: number) => {
                  const d = data[index];
                  if (d?.name) {
                    setHoverKey(d.name);
                    if (d && total > 0) {
                      setDisplayValue(Math.round((d.value / total) * 100));
                    }
                  }
                }}
              >
                {data.map((d) => (
                  <Cell
                    key={`cell-${d.name}`}
                    fill={`var(--color-${d.name})`}
                    fillOpacity={hoverKey ? (d.name === hoverKey ? 1 : 0.4) : 1}
                    className="transition"
                  />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        </div>
        {/* Center Label */}
        <div className="col-start-1 row-start-1 flex flex-col justify-center items-center text-2xl font-bold">
          <NumberFlow
            format={{ notation: "compact" }}
            value={displayValue}
            suffix={displaySuffix}
          />
          <div className="text-muted-foreground pb-4.5 font-normal text-xs">
            {centerLabel.suffix}
          </div>
        </div>
      </div>
      <div className="flex justify-center items-start">
        {showLegend ? (
          <div className="group flex items-center justify-center gap-0 pt-3 flex-wrap">
            {data.map((item) => {
              const key = item.name;
              const label = chartConfig[key]?.label || item.name;
              const color = resolvedColors[key];
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
                  onMouseEnter={() => onLegendEnter(key)}
                  onMouseLeave={onLegendLeave}
                >
                  <div
                    className="size-2 shrink-0 rounded-[2px]"
                    style={{ backgroundColor: color }}
                  />
                  <span className="capitalize">{label}</span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default PieDonut;
