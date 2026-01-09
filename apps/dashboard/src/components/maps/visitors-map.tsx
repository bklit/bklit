"use client";

import { Badge } from "@bklit/ui/components/badge";
import { Button } from "@bklit/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import { Separator } from "@bklit/ui/components/separator";
import { ResponsiveChoropleth } from "@nivo/geo";
import * as d3 from "d3";
import type { Feature } from "geojson";
import { Minus, Monitor, Plus, Smartphone } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CircleFlag } from "react-circle-flags";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import { getUniqueVisitorsByCountry } from "@/actions/analytics-actions";
import {
  getAlpha2Code,
  getCountryNameFromCode,
} from "@/lib/maps/country-coordinates";

// ISO 3166-1 numeric to alpha-3 code mapping (for TopoJSON feature IDs)
const numericToAlpha3: Record<string, string> = {
  "004": "AFG",
  "008": "ALB",
  "012": "DZA",
  "020": "AND",
  "024": "AGO",
  "028": "ATG",
  "032": "ARG",
  "051": "ARM",
  "036": "AUS",
  "040": "AUT",
  "031": "AZE",
  "044": "BHS",
  "048": "BHR",
  "050": "BGD",
  "052": "BRB",
  "112": "BLR",
  "056": "BEL",
  "084": "BLZ",
  "204": "BEN",
  "064": "BTN",
  "068": "BOL",
  "070": "BIH",
  "072": "BWA",
  "076": "BRA",
  "096": "BRN",
  "100": "BGR",
  "854": "BFA",
  "108": "BDI",
  "116": "KHM",
  "120": "CMR",
  "124": "CAN",
  "132": "CPV",
  "140": "CAF",
  "148": "TCD",
  "152": "CHL",
  "156": "CHN",
  "170": "COL",
  "174": "COM",
  "178": "COG",
  "180": "COD",
  "188": "CRI",
  "384": "CIV",
  "191": "HRV",
  "192": "CUB",
  "196": "CYP",
  "203": "CZE",
  "208": "DNK",
  "262": "DJI",
  "212": "DMA",
  "214": "DOM",
  "218": "ECU",
  "818": "EGY",
  "222": "SLV",
  "226": "GNQ",
  "232": "ERI",
  "233": "EST",
  "231": "ETH",
  "242": "FJI",
  "246": "FIN",
  "250": "FRA",
  "266": "GAB",
  "270": "GMB",
  "268": "GEO",
  "276": "DEU",
  "288": "GHA",
  "300": "GRC",
  "308": "GRD",
  "320": "GTM",
  "324": "GIN",
  "624": "GNB",
  "328": "GUY",
  "332": "HTI",
  "340": "HND",
  "348": "HUN",
  "352": "ISL",
  "356": "IND",
  "360": "IDN",
  "364": "IRN",
  "368": "IRQ",
  "372": "IRL",
  "376": "ISR",
  "380": "ITA",
  "388": "JAM",
  "392": "JPN",
  "400": "JOR",
  "398": "KAZ",
  "404": "KEN",
  "408": "PRK",
  "410": "KOR",
  "414": "KWT",
  "417": "KGZ",
  "418": "LAO",
  "428": "LVA",
  "422": "LBN",
  "426": "LSO",
  "430": "LBR",
  "434": "LBY",
  "438": "LIE",
  "440": "LTU",
  "442": "LUX",
  "807": "MKD",
  "450": "MDG",
  "454": "MWI",
  "458": "MYS",
  "462": "MDV",
  "466": "MLI",
  "470": "MLT",
  "478": "MRT",
  "480": "MUS",
  "484": "MEX",
  "498": "MDA",
  "492": "MCO",
  "496": "MNG",
  "499": "MNE",
  "504": "MAR",
  "508": "MOZ",
  "104": "MMR",
  "516": "NAM",
  "524": "NPL",
  "528": "NLD",
  "554": "NZL",
  "558": "NIC",
  "562": "NER",
  "566": "NGA",
  "578": "NOR",
  "512": "OMN",
  "586": "PAK",
  "591": "PAN",
  "598": "PNG",
  "600": "PRY",
  "604": "PER",
  "608": "PHL",
  "616": "POL",
  "620": "PRT",
  "634": "QAT",
  "642": "ROU",
  "643": "RUS",
  "646": "RWA",
  "662": "LCA",
  "670": "VCT",
  "882": "WSM",
  "674": "SMR",
  "678": "STP",
  "682": "SAU",
  "686": "SEN",
  "688": "SRB",
  "690": "SYC",
  "694": "SLE",
  "702": "SGP",
  "703": "SVK",
  "705": "SVN",
  "090": "SLB",
  "706": "SOM",
  "710": "ZAF",
  "724": "ESP",
  "144": "LKA",
  "729": "SDN",
  "740": "SUR",
  "748": "SWZ",
  "752": "SWE",
  "756": "CHE",
  "760": "SYR",
  "762": "TJK",
  "834": "TZA",
  "764": "THA",
  "626": "TLS",
  "768": "TGO",
  "776": "TON",
  "780": "TTO",
  "788": "TUN",
  "792": "TUR",
  "795": "TKM",
  "800": "UGA",
  "804": "UKR",
  "784": "ARE",
  "826": "GBR",
  "840": "USA",
  "858": "URY",
  "860": "UZB",
  "548": "VUT",
  "862": "VEN",
  "704": "VNM",
  "887": "YEM",
  "894": "ZMB",
  "716": "ZWE",
  "-99": "CYN",
  "010": "ATA",
};

interface VisitorsMapProps {
  projectId: string;
}

export function VisitorsMap({ projectId }: VisitorsMapProps) {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [visitorsData, setVisitorsData] = useState<
    {
      id: string;
      value: number;
      totalSessions: number;
      bounceRate: number;
      mobileSessions: number;
      desktopSessions: number;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    async function loadGeoData() {
      try {
        const response = await fetch(
          "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"
        );
        const topology: Topology<{ countries: GeometryCollection }> =
          await response.json();
        const geoJson = feature(topology, topology.objects.countries);
        const mappedFeatures = geoJson.features.map((f) => ({
          ...f,
          id: numericToAlpha3[f.id as string] || f.id,
        }));

        setFeatures(mappedFeatures);
      } catch (error) {
        console.error("Failed to load geo data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadGeoData();
  }, []);

  useEffect(() => {
    async function loadVisitorsData() {
      try {
        const data = await getUniqueVisitorsByCountry({ projectId });
        // Map the data to match ResponsiveChoropleth's expected format
        // The component expects 'id' and 'value' fields
        const mappedData = data.map((item) => ({
          id:
            item.id ||
            item.alpha3Code ||
            `country-${item.countryCode || Math.random()}`,
          value: item.value || item.totalSessions || 0,
          totalSessions: item.totalSessions,
          bounceRate: item.bounceRate,
          mobileSessions: item.mobileSessions,
          desktopSessions: item.desktopSessions,
        }));
        setVisitorsData(mappedData);
      } catch (error) {
        console.error("Error loading visitors data:", error);
        setVisitorsData([]);
      }
    }

    if (projectId) {
      loadVisitorsData();
    }
  }, [projectId]);

  useEffect(() => {
    if (!isMounted || loading || !containerRef.current) {
      return;
    }

    const findSVG = () => {
      return containerRef.current?.querySelector("svg");
    };

    const timeoutId = setTimeout(() => {
      const svg = findSVG();
      if (!svg) {
        return;
      }

      const allGroups = Array.from(svg.querySelectorAll("g"));

      const legendGroup = allGroups.find((g) => {
        const className = g.getAttribute("class") || "";
        return className.includes("legend") || className.includes("Legend");
      });

      let mapGroup = allGroups.find((g) => {
        const className = g.getAttribute("class") || "";
        return !(className.includes("legend") || className.includes("Legend"));
      }) as SVGGElement;

      if (mapGroup) {
        mapGroup.setAttribute(
          "class",
          `${mapGroup.getAttribute("class") || ""} zoom-group`.trim()
        );
      } else {
        mapGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        mapGroup.setAttribute("class", "zoom-group");

        for (const child of Array.from(svg.children)) {
          if (child !== legendGroup) {
            mapGroup.appendChild(child);
          }
        }
        svg.appendChild(mapGroup);
      }

      const zoom = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.5, 8])
        .filter((event) => {
          return event.type !== "wheel";
        })
        .on("zoom", (event) => {
          const { transform } = event;
          mapGroup.setAttribute("transform", transform.toString());

          if (legendGroup) {
            const inverseTransform = d3.zoomIdentity
              .translate(-transform.x, -transform.y)
              .scale(1 / transform.k);
            legendGroup.setAttribute("transform", inverseTransform.toString());
          }
        });

      d3.select(svg).call(zoom);
      zoomRef.current = zoom;

      const initialTransform = d3.zoomIdentity;
      d3.select(svg).call(zoom.transform, initialTransform);
    }, 200);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isMounted, loading]);

  const handleZoomIn = () => {
    if (!containerRef.current) {
      return;
    }
    const svg = containerRef.current.querySelector("svg");
    if (svg && zoomRef.current) {
      d3.select(svg)
        .transition()
        .duration(300)
        .call(zoomRef.current.scaleBy, 1.5);
    }
  };

  const handleZoomOut = () => {
    if (!containerRef.current) {
      return;
    }
    const svg = containerRef.current.querySelector("svg");
    if (svg && zoomRef.current) {
      d3.select(svg)
        .transition()
        .duration(300)
        .call(zoomRef.current.scaleBy, 0.67);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Visitors Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[400px] items-center justify-center">
            <div className="text-muted-foreground">Loading map data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxValue =
    visitorsData.length > 0 ? Math.max(...visitorsData.map((d) => d.value)) : 1;

  const customColors = [
    "color-mix(in oklch, var(--primary) 30%, transparent)",
    "color-mix(in oklch, var(--primary) 50%, transparent)",
    "color-mix(in oklch, var(--primary) 60%, transparent)",
    "color-mix(in oklch, var(--primary) 80%, transparent)",
    "var(--primary)",
  ];

  // Calculate ranges for the legend with proper handling for small values
  let legendItems: { label: string; color: string }[];

  if (maxValue < 5) {
    // Simplified legend for tiny datasets - show discrete values
    const items = [{ label: "No data", color: "var(--region)" }];
    for (let i = 1; i <= Math.min(maxValue, 4); i++) {
      const isLast = i === maxValue;
      items.push({
        label: isLast ? `${i}+` : i.toString(),
        color: customColors[Math.min(i - 1, 4)] || "var(--primary)",
      });
    }
    legendItems = items;
  } else {
    // For larger datasets, compute step to ensure non-zero, non-overlapping ranges
    const step = Math.max(1, Math.ceil(maxValue / 5));
    const range1 = step;
    const range2 = step * 2;
    const range3 = step * 3;
    const range4 = step * 4;

    legendItems = [
      { label: "No data", color: "var(--region)" },
      {
        label: `1-${range1.toLocaleString()}`,
        color: customColors[0] || "var(--primary)",
      },
      {
        label: `${(range1 + 1).toLocaleString()}-${range2.toLocaleString()}`,
        color: customColors[1] || "var(--primary)",
      },
      {
        label: `${(range2 + 1).toLocaleString()}-${range3.toLocaleString()}`,
        color: customColors[2] || "var(--primary)",
      },
      {
        label: `${(range3 + 1).toLocaleString()}-${range4.toLocaleString()}`,
        color: customColors[3] || "var(--primary)",
      },
      {
        label: `${(range4 + 1).toLocaleString()}+`,
        color: customColors[4] || "var(--primary)",
      },
    ];
  }

  if (!isMounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Visitors Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[400px] items-center justify-center">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative z-30 h-full overflow-visible p-0">
      <CardHeader className="absolute top-0 z-10 hidden w-full rounded-t-xl bg-card-background pt-6 pb-4 backdrop-blur-xl sm:grid">
        <CardTitle>Visitors by Country</CardTitle>
        <CardDescription>
          A map of the world with the number of unique visitors per country.
        </CardDescription>
      </CardHeader>
      <CardContent className="h-full min-h-[460px] w-full overflow-visible p-0">
        <div className="relative h-full w-full" ref={containerRef}>
          <div className="h-full w-full cursor-grab active:cursor-grabbing [&_svg]:rounded-xl [&_svg_path]:cursor-default">
            <ResponsiveChoropleth
              borderColor="var(--background)"
              borderWidth={0.5}
              colors={customColors}
              data={visitorsData}
              domain={[0, maxValue]}
              features={features}
              key={`choropleth-${projectId}-${visitorsData.map((d) => d.id).join("-")}`}
              label="properties.name"
              legends={[]}
              margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
              projectionScale={185}
              projectionTranslation={[0.5, 0.65]}
              projectionType="naturalEarth1"
              tooltip={({ feature: tooltipFeature }) => {
                const feature = tooltipFeature as unknown as {
                  id?: string;
                  properties?: { name?: string };
                };
                const featureId = feature.id || "";
                const data = visitorsData.find((d) => d.id === featureId);
                const countryName = getCountryNameFromCode(featureId);
                const alpha2Code = getAlpha2Code(featureId);
                const displayName =
                  countryName !== "Unknown"
                    ? countryName
                    : feature.properties?.name || featureId || "Unknown";
                return (
                  <Card className="z-60 w-80 bg-card/85 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CircleFlag
                          className="size-4"
                          countryCode={alpha2Code}
                        />
                        {displayName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {data ? (
                        <>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm">
                                Unique visitors
                              </span>
                              <Badge variant="secondary">
                                {data.totalSessions.toLocaleString()}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground text-sm">
                                Bounce rate
                              </span>
                              <Badge
                                variant={
                                  data.bounceRate > 30
                                    ? "destructive"
                                    : "success"
                                }
                              >
                                {data.bounceRate.toFixed(1)}%
                              </Badge>
                            </div>
                          </div>
                          <Separator />
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                              <span className="inline-flex items-center gap-2 text-muted-foreground text-sm">
                                <Smartphone className="size-4" />
                                Mobile
                              </span>
                              <Badge variant="secondary">
                                {data.mobileSessions.toLocaleString()}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="inline-flex items-center gap-2 text-muted-foreground text-sm">
                                <Monitor className="size-4" />
                                Desktop
                              </span>
                              <Badge variant="secondary">
                                {data.desktopSessions.toLocaleString()}
                              </Badge>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-muted-foreground text-sm">
                          No data
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              }}
              unknownColor="var(--region)"
              valueFormat=".2s"
            />
          </div>

          <div className="absolute bottom-4 left-6">
            <div className="mb-2 font-medium text-muted-foreground text-xs">
              Unique Visitors
            </div>
            <div className="flex flex-col gap-1.5">
              {legendItems.map((item) => (
                <div className="flex items-center gap-2" key={item.label}>
                  <div className="size-4 overflow-clip rounded-sm border border-border bg-background backdrop-blur-sm">
                    <div
                      className="size-full bg-background"
                      style={{ backgroundColor: item.color }}
                    />
                  </div>
                  <span className="text-foreground text-xs">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="absolute right-6 bottom-4 flex flex-col gap-2">
            <Button
              aria-label="Zoom in"
              className="shadow-lg"
              onClick={handleZoomIn}
              size="icon"
              variant="secondary"
            >
              <Plus className="size-4" />
            </Button>
            <Button
              aria-label="Zoom out"
              className="shadow-lg"
              onClick={handleZoomOut}
              size="icon"
              variant="secondary"
            >
              <Minus className="size-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
