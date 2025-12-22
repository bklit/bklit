"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import { ProgressRow } from "@bklit/ui/components/progress-row";
import { useQuery } from "@tanstack/react-query";
import { parseAsIsoDateTime, useQueryStates } from "nuqs";
import { useMemo } from "react";
import { CircleFlag } from "react-circle-flags";
import { getTopCountries } from "@/actions/analytics-actions";
import type { AnalyticsCardProps } from "@/types/analytics-cards";
import { NoDataCard } from "./no-data-card";

type TopCountriesCardProps = AnalyticsCardProps;

export function TopCountriesCard({ projectId, userId }: TopCountriesCardProps) {
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

  const { data: topCountries, isLoading } = useQuery({
    queryKey: ["top-countries", projectId, startDate, endDate],
    queryFn: () =>
      getTopCountries({
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
          <CardTitle>Top Countries</CardTitle>
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

  if (!topCountries || topCountries.length === 0) {
    return (
      <NoDataCard
        description="Top countries by page views."
        title="Top Countries"
      />
    );
  }

  const top10 = topCountries.slice(0, 10);
  const totalTop10Views = top10.reduce(
    (sum, c) => sum + (Number(c.views) || 0),
    0
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Countries</CardTitle>
        <CardDescription>Top countries by page views.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col">
          {top10.map((country) => {
            const percentage =
              totalTop10Views > 0
                ? ((Number(country.views) || 0) / totalTop10Views) * 100
                : 0;
            return (
              <ProgressRow
                icon={
                  <CircleFlag
                    className="size-4"
                    countryCode={country.countryCode?.toLowerCase() || "us"}
                  />
                }
                key={country.countryCode}
                label={country.country || "Unknown"}
                percentage={percentage}
                value={country.views}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
