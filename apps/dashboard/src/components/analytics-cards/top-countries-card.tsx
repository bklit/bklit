import { Badge } from "@bklit/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import { ProgressRow } from "@bklit/ui/components/progress-row";
import { CircleFlag } from "react-circle-flags";
import { getTopCountries } from "@/actions/analytics-actions";
import type { AnalyticsCardProps } from "@/types/analytics-cards";
import { NoDataCard } from "./no-data-card";

type TopCountriesCardProps = AnalyticsCardProps;

export async function TopCountriesCard({
  projectId,
  userId,
}: TopCountriesCardProps) {
  const topCountries = await getTopCountries({ projectId, userId });

  // Limit to top 10 and prepare percentage per country (not displayed, used in data attribute)
  const top10 = topCountries.slice(0, 10);
  const totalTop10Views = top10.reduce(
    (sum, c) => sum + (Number(c.views) || 0),
    0,
  );

  if (topCountries.length === 0) {
    return (
      <NoDataCard
        title="Top Countries"
        description="Top countries by page views."
      />
    );
  }

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
                key={country.countryCode}
                label={country.country || "Unknown"}
                value={country.views}
                percentage={percentage}
                icon={
                  <CircleFlag
                    countryCode={country.countryCode?.toLowerCase() || "us"}
                    className="size-4"
                  />
                }
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
