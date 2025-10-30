"use client";

import { PieDonut } from "@bklit/ui/components/charts/pie-donut";

interface BounceRateChartProps {
  bouncedSessions: number;
  totalSessions: number;
}

export function BounceRateChart({
  bouncedSessions,
  totalSessions,
}: BounceRateChartProps) {
  const nonBouncedSessions = totalSessions - bouncedSessions;
  const chartData = [
    { name: "engaged", value: nonBouncedSessions, label: "Engaged" },
    { name: "bounced", value: bouncedSessions, label: "Bounced" },
  ];

  return (
    <PieDonut
      data={chartData}
      variant="positive-negative"
      className="min-h-[200px] w-full"
    />
  );
}
