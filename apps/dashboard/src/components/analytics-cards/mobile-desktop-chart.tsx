"use client";

import { PieDonut } from "@bklit/ui/components/charts/pie-donut";

interface MobileDesktopChartProps {
  desktop: number;
  mobile: number;
}

export function MobileDesktopChart({
  desktop,
  mobile,
}: MobileDesktopChartProps) {
  const chartData = [
    { name: "desktop", value: desktop, label: "Desktop" },
    { name: "mobile", value: mobile, label: "Mobile" },
  ];
  return (
    <PieDonut
      data={chartData}
      className="min-h-[200px] w-full"
      centerLabel={{ showTotal: true, suffix: "unique visits" }}
    />
  );
}
