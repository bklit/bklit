"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import { ProgressRow } from "@bklit/ui/components/progress-row";
import { CircleFlag } from "react-circle-flags";

interface CountryData {
  country: string;
  countryCode: string;
  views: number;
}

interface PageData {
  path: string;
  count: number;
}

const mockCountries: CountryData[] = [
  { country: "United States", countryCode: "us", views: 45_230 },
  { country: "United Kingdom", countryCode: "gb", views: 28_340 },
  { country: "Germany", countryCode: "de", views: 19_250 },
  { country: "France", countryCode: "fr", views: 16_890 },
  { country: "Canada", countryCode: "ca", views: 12_450 },
];

const mockPages: PageData[] = [
  { path: "/", count: 125_430 },
  { path: "/products", count: 89_240 },
  { path: "/about", count: 45_670 },
  { path: "/contact", count: 23_450 },
  { path: "/blog", count: 18_920 },
];

export const TopCountriesDemo = () => {
  const top10 = mockCountries.slice(0, 10);
  const totalTop10Views = top10.reduce(
    (sum, c) => sum + (Number(c.views) || 0),
    0
  );

  const topPages = mockPages.slice(0, 5);
  const totalViews = topPages.reduce((sum, page) => sum + page.count, 0);

  return (
    <div className="relative flex h-full w-full items-center justify-center p-16">
      <div className="perspective-[2000px] grid grid-cols-1 grid-rows-1">
        <div className="-translate-x-10 hover:-translate-y-5 col-start-1 row-start-1 translate-y-0 rotate-x-0 rotate-y-0 transition-all duration-300 ease-in-out hover:z-2">
          <Card className="min-w-[460px] shadow-0 hover:shadow-2xl">
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
                          countryCode={country.countryCode.toLowerCase()}
                        />
                      }
                      key={country.countryCode}
                      label={country.country}
                      percentage={percentage}
                      value={country.views}
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="col-start-1 row-start-1 translate-x-10 translate-y-5 rotate-x-0 rotate-y-0 transition-all duration-300 ease-in-out hover:translate-y-0">
          <Card className="mt-4 min-w-[460px] translate-x-4 translate-y-4 shadow-2xl">
            <CardHeader>
              <CardTitle>Top Pages</CardTitle>
              <CardDescription>
                The most popular pages by views.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col">
                {topPages.map((page) => (
                  <ProgressRow
                    key={page.path}
                    label={page.path}
                    percentage={(page.count / totalViews) * 100}
                    value={page.count}
                    variant="secondary"
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
