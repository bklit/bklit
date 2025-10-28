import { Badge } from "@bklit/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
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
        <div className="flex flex-col gap-2">
          {topCountries.map((country) => (
            <div
              key={country.countryCode}
              className="flex flex-row justify-between items-center"
            >
              <div className="flex items-center gap-2">
                <CircleFlag
                  countryCode={country.countryCode?.toLowerCase() || "us"}
                  className="size-4"
                />
                <span className="font-medium text-xs">
                  {country.country || "Unknown"}
                </span>
              </div>
              <Badge variant="secondary">{country.views}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
