"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import { useQuery } from "@tanstack/react-query";
import { MonitorSmartphone } from "lucide-react";
import { parseAsIsoDateTime, useQueryStates } from "nuqs";
import { useMemo } from "react";
import { getMobileDesktopStats } from "@/actions/analytics-actions";
import { MobileDesktopChart } from "@/components/analytics-cards/mobile-desktop-chart";
import { NoDataCard } from "./no-data-card";

interface MobileDesktopCardProps {
  projectId: string;
  userId: string;
}

export function MobileDesktopCard({
  projectId,
  userId,
}: MobileDesktopCardProps) {
  const [dateParams] = useQueryStates(
    {
      startDate: parseAsIsoDateTime,
      endDate: parseAsIsoDateTime,
    },
    {
      history: "push",
    }
  );

  const startDate = useMemo(() => {
    if (dateParams.startDate) return dateParams.startDate;
    if (!dateParams.endDate) return undefined;
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  }, [dateParams.startDate, dateParams.endDate]);

  const endDate = dateParams.endDate ?? undefined;

  const { data: stats, isLoading } = useQuery({
    queryKey: ["mobile-desktop-stats", projectId, startDate, endDate],
    queryFn: () =>
      getMobileDesktopStats({
        projectId,
        userId,
        startDate,
        endDate,
      }),
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mobile/Desktop</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center">
            <div className="text-muted-foreground text-sm">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <NoDataCard
        description="Unique page visits by device type."
        icon={<MonitorSmartphone size={16} />}
        title="Mobile/Desktop"
      />
    );
  }

  const totalVisits = stats.desktop + stats.mobile;

  if (totalVisits === 0) {
    return (
      <NoDataCard
        description="Unique page visits by device type."
        icon={<MonitorSmartphone size={16} />}
        title="Mobile/Desktop"
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mobile/Desktop</CardTitle>
        <CardDescription>
          {totalVisits} unique page visits by device type.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <MobileDesktopChart desktop={stats.desktop} mobile={stats.mobile} />
      </CardContent>
    </Card>
  );
}
