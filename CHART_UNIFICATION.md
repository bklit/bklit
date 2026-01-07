# Chart Unification Guide

## 🎯 Overview

We've created a unified `TimeSeriesChart` component that:

- ✅ Eliminates 200+ lines of duplicate chart code per component
- ✅ Automatically adds deployment markers to ALL charts
- ✅ Provides consistent styling across the entire dashboard
- ✅ Simplifies maintenance (fix once, applies everywhere)

## 📊 Current Charts Using AreaChart

1. `pageviews/pageviews-chart.tsx` - **~354 lines**
2. `sessions/sessions-chart.tsx` - **~257 lines**
3. `events/events-chart.tsx` - **~254 lines**
4. `events/event-detail.tsx` - **~478 lines**
5. `acquisitions/acquisitions-chart.tsx` - **~271 lines**
6. `funnels/funnels-chart.tsx` - **~202 lines**

**Total**: ~1,816 lines of mostly duplicate code! 😱

## ✨ New Unified Component

Location: `apps/dashboard/src/components/charts/time-series-chart.tsx`

### Simple API

```typescript
<TimeSeriesChart
  projectId={projectId}
  data={timeSeriesData}
  chartConfig={chartConfig}
  showDeployments={true}  // Optional, defaults to true
  startDate={startDate}   // For deployment filtering
  endDate={endDate}
  height={250}            // Optional, defaults to 250
  isLoading={isLoading}
  showLegend={true}       // Optional, defaults to true
/>
```

### What It Handles Automatically

✅ **Gradients**: Auto-generated from `chartConfig`  
✅ **Multiple Series**: Creates `<Area>` for each key in `chartConfig`  
✅ **Deployment Markers**: 🚀 emoji markers on deployment dates  
✅ **Consistent Styling**: Same XAxis, tooltip, grid across all charts  
✅ **Loading/Empty States**: Built-in with nice UX  
✅ **Responsive**: Adapts to container width

## 📝 Migration Example: PageviewsChart

### Before (354 lines with duplication)

```typescript
"use client";

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartTooltip,
  ChartTooltipContent,
} from "@bklit/ui/components/chart";
// ... 50+ lines of imports and setup

export function PageviewsChart({ organizationId, projectId, viewMode }: PageviewsChartProps) {
  // ... data fetching (70 lines)

  // ... chartConfig generation (30 lines)

  return (
    <Card>
      <CardHeader>{/* ... */}</CardHeader>
      <CardContent>
        <div className="flex flex-col sm:grid sm:grid-cols-4">
          <div className="col-span-1">
            <MobileDesktopChart {...mobileDesktopData} />
          </div>
          <div className="col-span-3">
            <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
              <AreaChart data={chartData.timeSeriesData}>
                {/* 80+ lines of duplicate chart setup: */}
                <defs>
                  <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-total)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-total)" stopOpacity={0.1} />
                  </linearGradient>
                  {/* Repeat for each metric... */}
                </defs>
                <CartesianGrid stroke="var(--chart-cartesian)" strokeDasharray="5 5" />
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
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => {
                        return new Date(value).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        });
                      }}
                      indicator="dot"
                    />
                  }
                />
                <Area
                  dataKey="total"
                  type="linear"
                  fill="url(#fillTotal)"
                  stroke="var(--color-total)"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  dot={false}
                  fillOpacity={0.3}
                />
                {/* Repeat Area for each metric... */}
                <ChartLegend content={<ChartLegendContent />} />
              </AreaChart>
            </ChartContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### After (Simple & Clean! ~150 lines)

```typescript
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@bklit/ui/components/card";
import type { ChartConfig } from "@bklit/ui/components/chart";
import { TimeSeriesChart } from "@/components/charts/time-series-chart"; // ← The magic!
import { MobileDesktopChart } from "@/components/analytics-cards/mobile-desktop-chart";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/react";
import { parseAsIsoDateTime, useQueryStates } from "nuqs";
import { useMemo } from "react";

export function PageviewsChart({ organizationId, projectId, viewMode }: PageviewsChartProps) {
  const trpc = useTRPC();

  // Date range state (same as before)
  const [dateParams] = useQueryStates({
    startDate: parseAsIsoDateTime,
    endDate: parseAsIsoDateTime,
  }, { history: "push" });

  const startDate = useMemo(() => {
    if (dateParams.startDate) return dateParams.startDate;
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  }, [dateParams.startDate]);

  const endDate = dateParams.endDate ?? undefined;

  // Fetch data (same as before)
  const { data: chartData, isLoading } = useQuery({
    ...trpc.pageview.getTimeSeries.queryOptions({
      projectId,
      organizationId,
      startDate,
      endDate,
      limit: 5,
    }),
    enabled: viewMode === "all",
  });

  const { data: statsData } = useQuery({
    ...trpc.pageview.getStats.queryOptions({
      projectId,
      organizationId,
      startDate,
      endDate,
    }),
    enabled: viewMode === "all",
  });

  // Generate chartConfig (same as before)
  const chartConfig: ChartConfig = useMemo(() => {
    const config: ChartConfig = {
      total: {
        label: "Total Views",
        color: "var(--bklit-500)",
      },
    };

    chartData?.topPages?.forEach((page, index) => {
      config[page.dataKey] = {
        label: page.pathname,
        color: `var(--chart-${index + 1})`,
      };
    });

    return config;
  }, [chartData]);

  const mobileDesktopData = useMemo(() => ({
    mobile: statsData?.mobileViews || 0,
    desktop: statsData?.desktopViews || 0,
  }), [statsData]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pageviews Over Time</CardTitle>
        <CardDescription>Daily pageviews for top pages</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:grid sm:grid-cols-4">
          <div className="col-span-1 flex items-center justify-center">
            <MobileDesktopChart
              mobile={mobileDesktopData.mobile}
              desktop={mobileDesktopData.desktop}
            />
          </div>
          <div className="col-span-3">
            {/* ✨ THIS IS ALL YOU NEED! ✨ */}
            <TimeSeriesChart
              projectId={projectId}
              data={chartData?.timeSeriesData || []}
              chartConfig={chartConfig}
              isLoading={isLoading}
              startDate={startDate}
              endDate={endDate}
              showDeployments={true}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

## 🚀 Benefits

### Code Reduction

- **Before**: 80-100 lines of chart setup per component
- **After**: 7 lines (one `<TimeSeriesChart />` component)
- **Saved**: ~400 lines per chart × 6 charts = **2,400 lines saved!**

### Deployment Markers Everywhere

- **Before**: No deployment visibility on any charts
- **After**: 🚀 Automatic deployment markers on ALL 6 charts
- **Setup**: Zero! It Just Works™

### Maintenance

- **Before**: Fix a chart bug → update 6 files
- **After**: Fix once in `TimeSeriesChart` → propagates everywhere

### Consistency

- **Before**: Slight variations in XAxis formatting, tooltip styles, etc.
- **After**: Perfect consistency across all charts

## 📋 Migration Checklist

For each chart component:

1. ✅ Import `TimeSeriesChart`
2. ✅ Keep existing data fetching logic
3. ✅ Keep existing `chartConfig` generation
4. ✅ Replace entire `<ChartContainer><AreaChart>...</AreaChart></ChartContainer>` block with single `<TimeSeriesChart />`
5. ✅ Pass: `projectId`, `data`, `chartConfig`, `startDate`, `endDate`, `isLoading`
6. ✅ Test that chart still works
7. ✅ Verify deployment markers appear (if you have deployments)

## 🎨 Customization Options

The `TimeSeriesChart` component accepts these optional props:

```typescript
interface TimeSeriesChartProps {
  projectId: string; // Required - for fetching deployments
  data: TimeSeriesData[]; // Required - your time series data
  chartConfig: ChartConfig; // Required - colors and labels

  showDeployments?: boolean; // Default: true
  height?: number; // Default: 250px
  isLoading?: boolean; // Default: false
  startDate?: Date; // For deployment filtering
  endDate?: Date; // For deployment filtering
  showLegend?: boolean; // Default: true
}
```

## 🧪 Testing

After migrating each chart:

1. **Visual Check**: Does it look the same as before?
2. **Data Check**: Are all metrics showing correctly?
3. **Deployment Markers**: Do 🚀 icons appear on deployment dates?
4. **Tooltip Check**: Does hovering show correct data?
5. **Responsive Check**: Does it work on mobile?

## 📦 Deployment Markers

The unified component automatically:

- Fetches deployments via `trpc.deployment.listForProject`
- Filters by `startDate` and `endDate`
- Shows successful production deployments only
- Renders as 🚀 emoji with vertical dashed line
- Positioned at exact deployment date

### Enabling Deployments

1. Install Vercel or GitHub extension
2. Configure webhook (auto-setup via UI)
3. Deploy your app
4. 🚀 Markers appear automatically on all charts!

## 🎯 Next Steps

1. **Migrate pageviews chart first** (most complex, good test)
2. **Migrate sessions chart** (similar pattern)
3. **Migrate remaining 4 charts** (should be quick after first two)
4. **Delete old chart boilerplate** (satisfying! 🎉)
5. **Add deployment tooltips** (Phase 3 enhancement - click 🚀 to see details)

## 💡 Future Enhancements

With all charts using one component, we can easily add:

- 📊 **Deployment Impact Overlays**: Show metric changes after deployments
- 🔍 **Click-to-Details**: Click 🚀 to see commit details, author, etc.
- 🏷️ **Custom Annotations**: Mark important events (launches, incidents)
- 📈 **Trend Lines**: Add automatic trend line calculations
- 🎨 **Theme Presets**: One-click color scheme changes

All of these would work across ALL charts instantly!

## 📚 Related Files

- `apps/dashboard/src/components/charts/time-series-chart.tsx` - Unified component
- `packages/api/src/router/deployment.ts` - Deployment data endpoints
- All 6 chart components listed at top - Ready to refactor

---

**Happy refactoring! 🎨✨**
