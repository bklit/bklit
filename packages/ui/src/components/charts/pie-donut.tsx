"use client";

import { cn } from "@bklit/ui/lib/utils";
import NumberFlow from "@number-flow/react";
import { useEffect, useId, useMemo, useState } from "react";
import { Cell, Pie, PieChart, Sector } from "recharts";
import type { PieSectorDataItem } from "recharts/types/polar/Pie";
import { type ChartConfig, ChartContainer, ChartLegend } from "../chart";

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
  innerRadius = 54,
  outerRadius = 80,
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

  // Initialize displayValue with total
  useEffect(() => {
    setDisplayValue(total);
  }, [total]);

  const resolvedColors = useMemo(() => {
    if (colors) return colors;
    // Assign shadcn chart-1..5 by order; for positive-negative, use --chart-1 and --chart-negative
    const map: Record<string, string> = {};
    if (variant === "positive-negative" && data.length >= 2) {
      const first = data[0]?.name;
      const second = data[1]?.name;
      if (first) map[first] = "var(--chart-1)";
      if (second) map[second] = "var(--chart-negative)";
      for (let i = 2; i < data.length; i++) {
        const key = data[i]?.name;
        if (key) map[key] = `var(--chart-${((i % 5) + 1) as number})`;
      }
      return map;
    }
    data.forEach((d, idx) => {
      map[d.name] = `var(--chart-${((idx % 5) + 1) as number})`;
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
    <div className="grid grid-cols-1 grid-rows-1 aspect-square max-h-[250px] mx-auto justify-center items-center">
      <div className="col-start-1 row-start-1 flex justify-center items-center">
        <ChartContainer
          id={chartId}
          config={chartConfig}
          className={cn("mx-auto aspect-square max-h-[250px]", className)}
        >
          <PieChart accessibilityLayer>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              strokeWidth={5}
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
                    setDisplayValue(Math.round((hovered.value / total) * 100));
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
              activeShape={({
                outerRadius = 0,
                ...props
              }: PieSectorDataItem) => (
                <Sector {...props} outerRadius={outerRadius + 10} />
              )}
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
            {showLegend ? (
              <ChartLegend
                content={(legendProps: unknown) => {
                  const payload = (
                    legendProps as {
                      payload?: ReadonlyArray<{
                        value?: string;
                        dataKey?: string;
                        color?: string;
                      }>;
                    }
                  ).payload;
                  return (
                    <div className="flex items-center justify-center gap-4 pt-3">
                      {payload?.map((item) => (
                        <button
                          key={item.dataKey || item.value}
                          type="button"
                          className="flex items-center gap-1.5"
                          onMouseEnter={() =>
                            onLegendEnter(item.dataKey || item.value)
                          }
                          onMouseLeave={onLegendLeave}
                        >
                          <div
                            className="h-2 w-2 shrink-0 rounded-[2px]"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="capitalize">{item.value}</span>
                        </button>
                      ))}
                    </div>
                  );
                }}
              />
            ) : null}
          </PieChart>
        </ChartContainer>
      </div>
      <div className="col-start-1 row-start-1 flex flex-col justify-center items-center text-2xl font-bold pb-3">
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
  );
}

export default PieDonut;
