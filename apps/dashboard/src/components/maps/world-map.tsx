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
import * as d3 from "d3";
import { Minus, Monitor, Plus, Smartphone } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CircleFlag } from "react-circle-flags";
import * as topojson from "topojson-client";
import { getCountryVisitStats } from "@/actions/analytics-actions";

interface CountryVisitData {
  country: string;
  countryCode: string;
  totalVisits: number;
  mobileVisits: number;
  desktopVisits: number;
  uniqueVisits: number;
  coordinates: [number, number] | null;
}

interface WorldMapProps {
  projectId: string;
  userId: string;
}

export function WorldMap({ projectId, userId }: WorldMapProps) {
  const [isMounted, setIsMounted] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [visitData, setVisitData] = useState<CountryVisitData[]>([]);
  const [tooltipData, setTooltipData] = useState<CountryVisitData | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Ensure component only renders on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleZoomIn = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(300)
        .call(zoomRef.current.scaleBy, 1.5);
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(300)
        .call(zoomRef.current.scaleBy, 0.67);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getCountryVisitStats({ projectId, userId });
        setVisitData(data);
      } catch (error) {
        console.error("Error loading visit data:", error);
        // Set empty array on error so map still renders
        setVisitData([]);
      }
    };

    loadData();
  }, [projectId, userId]);

  useEffect(() => {
    if (!svgRef.current || !isMounted) return;

    const svg = d3.select(svgRef.current);
    const width = 960;
    const height = 500;

    // Clear previous content
    svg.selectAll("*").remove();

    // Create main group for zoom/pan
    const g = svg.append("g");

    // Set up projection
    const projection = d3
      .geoNaturalEarth1()
      .scale(350)
      .translate([width / 2, height / 1.1]);

    const path = d3.geoPath().projection(projection);

    // Set up zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 8])
      .filter((event) => {
        // Disable wheel zoom, allow all other events
        return event.type !== "wheel";
      })
      .on("zoom", (event) => {
        const { transform } = event;
        g.attr("transform", transform);

        // Scale markers with zoom
        g.selectAll(".marker")
          .attr(
            "r",
            // biome-ignore lint/suspicious/noExplicitAny: D3 data binding types are complex
            (d: any) => {
              const totalVisits = Number(d.totalVisits) || 0;
              return (Math.sqrt(totalVisits / 10) + 6) / transform.k;
            },
          )
          .attr("stroke-width", 2 / transform.k);
      });

    // Store zoom behavior in ref for button access
    zoomRef.current = zoom;

    svg.call(zoom);

    // Load and render world map
    d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then((world) => {
        if (!world) {
          console.error("World map data is null");
          setIsMapLoading(false);
          return;
        }

        const countries = topojson.feature(
          // biome-ignore lint/suspicious/noExplicitAny: D3 and TopoJSON types are complex and external
          world as any,
          // biome-ignore lint/suspicious/noExplicitAny: D3 and TopoJSON types are complex and external
          (world as any).objects.countries,
        );

        // Draw countries
        g.selectAll(".country")
          // biome-ignore lint/suspicious/noExplicitAny: D3 and TopoJSON types are complex and external
          .data((countries as any).features)
          .enter()
          .append("path")
          .attr("class", "country")
          .attr("d", (d) => path(d as d3.GeoPermissibleObjects) || "")
          .attr("fill", "var(--color-region)")
          .attr("stroke", "var(--color-region)")
          .attr("stroke-width", 0)
          // .attr("opacity", 0.33)
          .on("mouseover", function () {
            d3.select(this).attr("fill", "var(--color-region-hover)");
          })
          .on("mouseout", function () {
            d3.select(this).attr("fill", "var(--color-region)");
          });

        setIsMapLoading(false);
      })
      .catch((error) => {
        console.error("Error loading world map data:", error);
        setIsMapLoading(false);
      });
  }, [isMounted]);

  // Separate effect to handle visit data updates and marker rendering
  useEffect(() => {
    if (!svgRef.current || !isMounted || isMapLoading) return;

    const svg = d3.select(svgRef.current);
    const g = svg.select("g");

    if (g.empty()) return;

    // Clear existing markers
    g.selectAll(".marker").remove();

    // Add circle markers for countries with visits (only if we have data)
    if (visitData.length > 0) {
      const validData = visitData.filter((d) => {
        const hasCoordinates = d.coordinates !== null;
        const hasValidVisits =
          typeof d.totalVisits === "number" && !Number.isNaN(d.totalVisits);
        if (!hasCoordinates || !hasValidVisits) {
          console.warn("Invalid data for marker:", d);
        }
        return hasCoordinates && hasValidVisits;
      });

      // Get projection from the existing map
      const projection = d3.geoNaturalEarth1().scale(350).translate([480, 250]); // width/2, height/1.1

      const markers = g
        .selectAll(".marker")
        .data(validData)
        .enter()
        .append("circle")
        .attr("class", "marker")
        .attr("cx", (d) => projection(d.coordinates || [0, 0])?.[0] || 0)
        .attr("cy", (d) => projection(d.coordinates || [0, 0])?.[1] || 0)
        .attr("r", 0)
        .attr("fill", "var(--card-background)")
        .attr("stroke", "var(--card-foreground)")
        .attr("stroke-width", 2)
        .attr("opacity", 0.8)
        .style("cursor", "pointer");

      // Animate markers
      markers
        .transition()
        .duration(1000)
        .delay((_d, i) => i * 100)
        .attr("r", (d) => {
          const totalVisits = Number(d.totalVisits) || 0;
          return Math.sqrt(totalVisits / 10) + 6;
        });

      // Add tooltip interactions
      markers
        .on("mouseover", function (event, d) {
          // Highlight marker
          const totalVisits = Number(d.totalVisits) || 0;
          d3.select(this)
            .transition()
            .duration(200)
            .attr("r", Math.sqrt(totalVisits / 10) + 8)
            .attr("opacity", 1);

          // Show tooltip
          const svgRect = svgRef.current?.getBoundingClientRect();
          const relativeX = event.clientX - (svgRect?.left || 0);
          const relativeY = event.clientY - (svgRect?.top || 0);

          setTooltipData(d);
          setTooltipPosition({ x: relativeX, y: relativeY });
        })
        .on("mousemove", (event) => {
          const svgRect = svgRef.current?.getBoundingClientRect();
          const relativeX = event.clientX - (svgRect?.left || 0);
          const relativeY = event.clientY - (svgRect?.top || 0);

          setTooltipPosition({ x: relativeX, y: relativeY });
        })
        .on("mouseout", function (d) {
          // Reset marker
          const totalVisits = Number(d.totalVisits) || 0;
          d3.select(this)
            .transition()
            .duration(200)
            .attr("r", Math.sqrt(totalVisits / 10) + 6);

          // Restore all countries to normal opacity and color
          g.selectAll(".country")
            .transition()
            .duration(200)
            .attr("fill", "var(--color-region)");

          // Hide tooltip
          setTooltipData(null);
        });
    }
  }, [visitData, isMounted, isMapLoading]);

  // Don't render anything on server to prevent hydration mismatch
  if (!isMounted) {
    return (
      <div className="relative w-full h-full">
        <div className="bg-accent animate-pulse rounded-md h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full">
      {isMapLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-card-background z-20">
          <div className="text-lg">Loading world map...</div>
        </div>
      )}

      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox="0 0 960 500"
        className="cursor-grab active:cursor-grabbing rounded-xl"
      />

      {/* Zoom Controls */}
      <div className="absolute bottom-4 left-6 z-10 flex flex-col gap-2">
        <Button
          size="icon"
          variant="secondary"
          onClick={handleZoomIn}
          className="shadow-lg"
          aria-label="Zoom in"
        >
          <Plus className="size-4" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          onClick={handleZoomOut}
          className="shadow-lg"
          aria-label="Zoom out"
        >
          <Minus className="size-4" />
        </Button>
      </div>

      {tooltipData && (
        <Card
          className="absolute pointer-events-none z-30 bg-card/85 backdrop-blur-sm w-80"
          style={{
            left: tooltipPosition.x + 10,
            top: tooltipPosition.y - 10,
            transform: "translateY(-100%)",
          }}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CircleFlag
                className="size-4"
                countryCode={tooltipData.countryCode.toLowerCase()}
              />
              {tooltipData.country}
            </CardTitle>
            <CardDescription>
              Analytics data for {tooltipData.country}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total pageviews</span>
                <Badge variant="secondary">{tooltipData.totalVisits}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Total unique visitors
                </span>
                <Badge variant="secondary">{tooltipData.uniqueVisits}</Badge>
              </div>
            </div>
            <Separator />
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="inline-flex gap-2 items-center text-sm text-muted-foreground">
                  <Smartphone className="size-4" />
                  Mobile
                </span>
                <Badge variant="secondary">{tooltipData.mobileVisits}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex gap-2 items-center text-sm text-muted-foreground">
                  <Monitor className="size-4" />
                  Desktop
                </span>
                <Badge variant="secondary">{tooltipData.desktopVisits}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
