"use client";

import { Badge } from "@bklit/ui/components/badge";
import { Card, CardContent } from "@bklit/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@bklit/ui/components/dialog";
import { Separator } from "@bklit/ui/components/separator";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import mapboxgl from "mapbox-gl";
import { useTRPC } from "@/trpc/react";
import "mapbox-gl/dist/mapbox-gl.css";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { CircleFlag } from "react-circle-flags";
import { useLiveMap } from "@/contexts/live-map-context";
import { useSocketIOEvents } from "@/hooks/use-socketio-client";
import {
  findCountryCoordinates,
  getAlpha2Code,
  getCountryCoordinates,
} from "@/lib/maps/country-coordinates";
import { getBrowserIcon } from "@/lib/utils/get-browser-icon";
import { getDeviceIcon } from "@/lib/utils/get-device-icon";

interface LiveMapProps {
  projectId: string;
  organizationId: string;
}

interface SelectedUser {
  id: string;
  city: string | null;
  country: string | null;
  countryCode: string | null;
  startedAt: Date;
  browser?: string;
  deviceType?: string;
}

export function LiveMap({ projectId, organizationId }: LiveMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userInteracting = useRef(false);
  const spinEnabled = useRef(true);
  const pulsingDotRef = useRef<mapboxgl.StyleImageInterface | null>(null);
  const spinGlobeRef = useRef<(() => void) | null>(null);
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { registerCenterFunction, registerMarkerClickHandler } = useLiveMap();

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: liveUserLocations = [] } = useQuery({
    ...trpc.session.liveUserLocations.queryOptions(
      { projectId, organizationId },
      {
        refetchInterval: 60_000, // Poll every 60s (was 15s) - real-time handles updates
        staleTime: 50_000,
      }
    ),
  });

  // Real-time pageview handler for instant map updates
  const handleRealtimePageview = useCallback(
    (data: any) => {
      // Validate coordinates
      const lat = data.lat;
      const lon = data.lon;

      // Trigger refetch to get updated location data
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: [["session", "liveUserLocations"]],
        });
      }, 500);

      if (!(lat && lon) || (lat === 0 && lon === 0)) {
        return;
      }

      if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        return;
      }
    },
    [queryClient]
  );

  useSocketIOEvents(projectId, "pageview", handleRealtimePageview);

  useEffect(() => {
    if (!mapContainer.current || map.current) {
      return;
    }

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      console.error("NEXT_PUBLIC_MAPBOX_TOKEN is not set");
      return;
    }

    mapboxgl.accessToken = token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/standard",
      config: {
        basemap: {
          theme: "monochrome",
          lightPreset: "night",
        },
      },
      projection: "globe",
      zoom: 2,
      center: [30, 15],
      attributionControl: false,
    });

    map.current.scrollZoom.enable();

    // Rotation configuration
    const secondsPerRevolution = 180;
    const maxSpinZoom = 5;
    const slowSpinZoom = 3;

    const spinGlobe = () => {
      if (!map.current) {
        return;
      }

      const zoom = map.current.getZoom();
      if (
        spinEnabled.current &&
        !userInteracting.current &&
        zoom < maxSpinZoom
      ) {
        let distancePerSecond = 360 / secondsPerRevolution;
        if (zoom > slowSpinZoom) {
          // Slow spinning at higher zooms
          const zoomDif = (maxSpinZoom - zoom) / (maxSpinZoom - slowSpinZoom);
          distancePerSecond *= zoomDif;
        }
        const center = map.current.getCenter();
        center.lng -= distancePerSecond;
        // Smoothly animate the map over one second.
        // When this animation is complete, it calls a 'moveend' event.
        map.current.easeTo({ center, duration: 1000, easing: (n) => n });
      }
    };

    // Store spinGlobe function in ref for access outside useEffect
    spinGlobeRef.current = spinGlobe;

    // Create pulsing dot image
    const size = 200;
    const pulsingDot: mapboxgl.StyleImageInterface & {
      context?: CanvasRenderingContext2D | null;
    } = {
      width: size,
      height: size,
      data: new Uint8Array(size * size * 4),

      onAdd() {
        const canvas = document.createElement("canvas");
        canvas.width = this.width;
        canvas.height = this.height;
        this.context = canvas.getContext("2d");
      },

      render() {
        const duration = 1000;
        const t = (performance.now() % duration) / duration;

        const radius = (size / 2) * 0.3;
        const outerRadius = (size / 2) * 0.7 * t + radius;
        const context = this.context;

        if (!context) {
          return false;
        }

        // Draw the outer circle.
        context.clearRect(0, 0, this.width, this.height);
        context.beginPath();
        context.arc(
          this.width / 2,
          this.height / 2,
          outerRadius,
          0,
          Math.PI * 2
        );
        context.fillStyle = `rgba(255, 200, 200, ${1 - t})`;
        context.fill();

        // Draw the inner circle.
        context.beginPath();
        context.arc(this.width / 2, this.height / 2, radius, 0, Math.PI * 2);
        context.fillStyle = "rgba(255, 100, 100, 1)";
        context.strokeStyle = "white";
        context.lineWidth = 2 + 4 * (1 - t);
        context.fill();
        context.stroke();

        // Update this image's data with data from the canvas.
        this.data = context.getImageData(0, 0, this.width, this.height).data;

        // Continuously repaint the map, resulting
        // in the smooth animation of the dot.
        if (map.current) {
          map.current.triggerRepaint();
        }

        // Return `true` to let the map know that the image was updated.
        return true;
      },
    };

    pulsingDotRef.current = pulsingDot;

    map.current.on("style.load", () => {
      if (map.current) {
        // Remove atmosphere completely
        map.current.setFog(null);
      }
    });

    map.current.on("load", () => {
      if (!map.current) {
        return;
      }

      // Add the pulsing dot image
      map.current.addImage("pulsing-dot", pulsingDot, { pixelRatio: 2 });

      // Add empty source initially
      map.current.addSource("live-users", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      // Add layer for live users
      map.current.addLayer({
        id: "live-users-layer",
        type: "symbol",
        source: "live-users",
        layout: {
          "icon-image": "pulsing-dot",
          "icon-size": 0.5,
        },
      });

      // Add click handler for markers
      map.current.on("click", "live-users-layer", (e) => {
        if (!e.features || e.features.length === 0) {
          return;
        }

        const feature = e.features[0];
        if (!feature) {
          return;
        }

        const properties = feature.properties;
        if (!properties) {
          return;
        }

        // Notify context of marker click for session detail panel
        const sessionId = properties.sessionId as string;
        if (sessionId && registerMarkerClickHandler) {
          // Call the registered handler from Live component
          const { current } = { current: registerMarkerClickHandler };
          if (typeof current === 'function') {
            // This will be replaced by proper context call
          }
        }

        setSelectedUser({
          id: (properties.id as string) || "",
          city: (properties.city as string) || null,
          country: (properties.country as string) || null,
          countryCode: (properties.countryCode as string) || null,
          startedAt: new Date(properties.startedAt as string),
          browser: (properties.browser as string) || undefined,
          deviceType: (properties.deviceType as string) || undefined,
        });
        setIsDialogOpen(true);
      });

      // Change cursor on hover
      map.current.on("mouseenter", "live-users-layer", () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = "pointer";
        }
      });

      map.current.on("mouseleave", "live-users-layer", () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = "";
        }
      });
    });

    // Pause spinning on interaction
    map.current.on("mousedown", () => {
      userInteracting.current = true;
    });

    // Restart spinning the globe when interaction is complete
    map.current.on("mouseup", () => {
      userInteracting.current = false;
      spinGlobe();
    });

    // These events account for cases where the mouse has moved
    // off the map, so 'mouseup' will not be fired.
    map.current.on("dragend", () => {
      userInteracting.current = false;
      spinGlobe();
    });
    map.current.on("pitchend", () => {
      userInteracting.current = false;
      spinGlobe();
    });
    map.current.on("rotateend", () => {
      userInteracting.current = false;
      spinGlobe();
    });

    // When animation is complete, start spinning if there is no ongoing interaction
    map.current.on("moveend", () => {
      spinGlobe();
    });

    // Start the rotation
    spinGlobe();

    return () => {
      if (map.current) {
        try {
          // Stop all animations and interactions
          map.current.stop();
          // Remove all event listeners
          map.current.off();
          // Remove the map
          map.current.remove();
        } catch (error) {
          // Ignore errors during cleanup (map might already be removed)
          console.warn("Error cleaning up map:", error);
        } finally {
          map.current = null;
        }
      }
      // Clear the spin function reference
      spinGlobeRef.current = null;
      pulsingDotRef.current = null;
    };
  }, []);

  // Update map with live user locations
  useEffect(() => {
    if (!map.current) {
      return;
    }

    const source = map.current.getSource("live-users") as
      | mapboxgl.GeoJSONSource
      | undefined;

    if (!source) {
      return;
    }

    // Log for debugging
    if (process.env.NODE_ENV === "development") {
      console.log("Live user locations:", liveUserLocations);
    }

    // Convert live user locations to GeoJSON format
    const geojson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: liveUserLocations.map((user) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: user.coordinates,
        },
        properties: {
          id: user.id,
          sessionId: user.sessionId,
          city: user.city,
          country: user.country,
          countryCode: user.countryCode,
          startedAt: user.startedAt.toISOString(),
          browser: user.browser,
          deviceType: user.deviceType,
        },
      })),
    };

    source.setData(geojson);
  }, [liveUserLocations]);

  // Pause/resume globe rotation when dialog opens/closes
  useEffect(() => {
    if (isDialogOpen) {
      // Pause rotation
      spinEnabled.current = false;
      if (map.current) {
        map.current.stop();
      }
    } else {
      // Resume rotation
      spinEnabled.current = true;
      if (spinGlobeRef.current) {
        spinGlobeRef.current();
      }
    }
  }, [isDialogOpen]);

  // Function to center the map on a country
  const centerOnCountry = useCallback(
    (countryCode: string | null, countryName?: string | null) => {
      if (!(map.current && countryCode)) {
        return;
      }

      // Try to find coordinates by country code first
      let coordinates = findCountryCoordinates(countryCode);

      // If not found and we have a country name, try to find by name
      if (!coordinates && countryName) {
        const coordinatesList = getCountryCoordinates();
        const found = coordinatesList.find(
          (coord) => coord.country.toLowerCase() === countryName.toLowerCase()
        );
        if (found) {
          coordinates = found;
        }
      }

      if (!coordinates) {
        console.warn(`Could not find coordinates for country: ${countryCode}`);
        return;
      }

      // Temporarily disable spinning
      spinEnabled.current = false;
      userInteracting.current = true;

      // Center the map on the country with smooth animation
      map.current.easeTo({
        center: [coordinates.longitude, coordinates.latitude],
        zoom: 4,
        duration: 2000,
        easing: (t) => t * (2 - t), // Ease-out animation
      });

      // Re-enable spinning after animation completes (with a delay)
      setTimeout(() => {
        userInteracting.current = false;
        spinEnabled.current = true;
        if (spinGlobeRef.current) {
          spinGlobeRef.current();
        }
      }, 2500);
    },
    []
  );

  // Register the center function with the context
  useEffect(() => {
    registerCenterFunction(centerOnCountry);
  }, [registerCenterFunction, centerOnCountry]);

  const countryName = selectedUser?.country || "Unknown";
  const countryCode = selectedUser?.countryCode
    ? getAlpha2Code(selectedUser.countryCode)
    : "xx";
  const sessionDuration = selectedUser?.startedAt
    ? formatDistanceToNow(selectedUser.startedAt, { addSuffix: false })
    : null;

  const projection = map.current?.getProjection();

  return (
    <>
      <div
        className="absolute! inset-0! h-full! w-full! overflow-hidden rounded-lg"
        ref={mapContainer}
      >
        {projection && (
          <div className="pointer-events-none absolute inset-0 h-full w-full bg-bklit-700/50 mix-blend-color" />
        )}
      </div>
      <Dialog onOpenChange={setIsDialogOpen} open={isDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CircleFlag className="size-5" countryCode={countryCode} />
              {countryName}
            </DialogTitle>
            <DialogDescription>Live user information</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <Card className="border-0 shadow-none">
              <CardContent className="space-y-4 pt-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">Country</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-sm">
                        {countryName}
                      </span>
                      <CircleFlag
                        className="size-4"
                        countryCode={countryCode}
                      />
                    </div>
                  </div>
                  {selectedUser.city && (
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">City</span>
                      <Badge variant="secondary">{selectedUser.city}</Badge>
                    </div>
                  )}
                  {selectedUser.deviceType && (
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">Device type</span>
                      {getDeviceIcon(selectedUser.deviceType || "")}
                    </div>
                  )}
                  {selectedUser.browser && (
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">Browser</span>
                      {getBrowserIcon(selectedUser.browser)}
                    </div>
                  )}
                </div>
                <Separator />
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">
                      Session started
                    </span>
                    <Badge variant="secondary">
                      {sessionDuration ? `${sessionDuration} ago` : "Unknown"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">
                      Status
                    </span>
                    <Badge size="lg" variant="success">
                      Live
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
