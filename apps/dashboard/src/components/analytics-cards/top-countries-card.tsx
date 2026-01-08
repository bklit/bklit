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
import { parseAsBoolean, parseAsIsoDateTime, useQueryStates } from "nuqs";
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
      compare: parseAsBoolean.withDefault(true),
    },
    {
      history: "push",
    }
  );

  const startDate = useMemo(() => {
    if (dateParams.startDate) {
      return dateParams.startDate;
    }
    if (!dateParams.endDate) {
      return undefined;
    }
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  }, [dateParams.startDate, dateParams.endDate]);

  const endDate = dateParams.endDate ?? undefined;

  const { previousStartDate, previousEndDate } = useMemo(() => {
    if (!(startDate && endDate)) {
      return { previousStartDate: undefined, previousEndDate: undefined };
    }
    const diffMs = endDate.getTime() - startDate.getTime();
    const prevEnd = new Date(startDate.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - diffMs);
    return {
      previousStartDate: prevStart,
      previousEndDate: prevEnd,
    };
  }, [startDate, endDate]);

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

  const { data: previousTopCountries } = useQuery({
    queryKey: ["top-countries", projectId, previousStartDate, previousEndDate],
    queryFn: () =>
      getTopCountries({
        projectId,
        userId,
        startDate: previousStartDate,
        endDate: previousEndDate,
      }),
    enabled: dateParams.compare && !!previousStartDate && !!previousEndDate,
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

  // Calculate changes
  const calculateChange = (
    currentViews: number,
    countryCode: string
  ): number | null => {
    if (!(dateParams.compare && previousTopCountries)) {
      return null;
    }
    const previousCountry = previousTopCountries.find(
      (c) => c.countryCode === countryCode
    );
    const previousViews = previousCountry ? Number(previousCountry.views) : 0;
    if (previousViews === 0) {
      return currentViews > 0 ? 100 : null;
    }
    return ((currentViews - previousViews) / previousViews) * 100;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Countries</CardTitle>
        <CardDescription>Top countries by page views.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col">
          {top10.map((country) => {
            const currentViews = Number(country.views) || 0;
            const percentage =
              totalTop10Views > 0 ? (currentViews / totalTop10Views) * 100 : 0;
            const change = calculateChange(currentViews, country.countryCode);
            return (
              <ProgressRow
                change={change}
                changeUniqueKey={`country-${country.countryCode}`}
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
