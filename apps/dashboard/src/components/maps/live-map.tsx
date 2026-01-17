"use client";

import { useQuery } from "@tanstack/react-query";
import mapboxgl from "mapbox-gl";
import { useTRPC } from "@/trpc/react";
import "mapbox-gl/dist/mapbox-gl.css";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { useLiveMap } from "@/contexts/live-map-context";
import { useSocketIOEvents } from "@/hooks/use-socketio-client";
import {
  findCountryCoordinates,
  getCountryCoordinates,
} from "@/lib/maps/country-coordinates";
import { parseRGB } from "@/lib/maps/marker-colors";

interface LiveMapProps {
  projectId: string;
  organizationId: string;
}

// Helper function to create a static gradient circle marker
function createGradientCircle(
  fromColor: string,
  toColor: string
): mapboxgl.StyleImageInterface {
  const size = 80;
  const from = parseRGB(fromColor);
  const to = parseRGB(toColor);

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d")!;

  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size / 2 - 4;

  // Create radial gradient matching card: from-cyan-400 to-indigo-500
  // Card uses linear gradient top-left to bottom-right, we'll simulate with radial
  const gradient = context.createRadialGradient(
    centerX - radius * 0.3,
    centerY - radius * 0.3,
    0,
    centerX,
    centerY,
    radius
  );
  gradient.addColorStop(0, `rgba(${from.r}, ${from.g}, ${from.b}, 1)`); // Cyan center
  gradient.addColorStop(1, `rgba(${to.r}, ${to.g}, ${to.b}, 1)`); // Indigo edge

  // Draw the circle with gradient
  context.beginPath();
  context.arc(centerX, centerY, radius, 0, Math.PI * 2);
  context.fillStyle = gradient;
  context.fill();

  // Add white border
  context.strokeStyle = "rgba(255, 255, 255, 0.95)";
  context.lineWidth = 2;
  context.stroke();

  // Get the image data immediately
  const imageData = context.getImageData(0, 0, size, size);

  return {
    width: size,
    height: size,
    data: imageData.data,

    onAdd() {
      // Image already drawn
    },

    render() {
      // Static image - no animation
      return false;
    },
  };
}

export function LiveMap({ projectId, organizationId }: LiveMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userInteracting = useRef(false);
  const spinEnabled = useRef(true);
  const pulsingDotRef = useRef<mapboxgl.StyleImageInterface | null>(null);
  const spinGlobeRef = useRef<(() => void) | null>(null);
  const onMarkerClickRef = useRef<((sessionId: string) => void) | null>(null);
  const { registerCenterFunction, onMarkerClick } = useLiveMap();

  // Keep ref updated with latest onMarkerClick
  useEffect(() => {
    onMarkerClickRef.current = onMarkerClick;
  }, [onMarkerClick]);

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
    (data: { lat?: number; lon?: number }) => {
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

      // Add the default pulsing dot image (fallback)
      map.current.addImage("pulsing-dot-default", pulsingDot, {
        pixelRatio: 2,
      });

      // Add empty source initially
      map.current.addSource("live-users", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      // Add layer for live users with dynamic icon images
      map.current.addLayer({
        id: "live-users-layer",
        type: "symbol",
        source: "live-users",
        layout: {
          "icon-image": ["get", "iconImage"], // Use the iconImage property from the feature
          "icon-size": 0.5,
          "icon-allow-overlap": true, // Allow markers to overlap
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

        const sessionId =
          (properties.sessionId as string) || (properties.id as string);

        // Notify the Live component to show user details in the card
        if (sessionId && onMarkerClickRef.current) {
          onMarkerClickRef.current(sessionId);
        }
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
          // Remove the map (this also removes all event listeners)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onMarkerClick is from stable context, map should only init once
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
    console.log(
      "[Live Map] User locations:",
      liveUserLocations.length,
      liveUserLocations
    );

    // Create gradient circle markers for each user (matching card gradient)
    for (const user of liveUserLocations) {
      const iconId = `gradient-circle-${user.id}`;

      // Remove old image if it exists
      if (map.current && map.current.hasImage(iconId)) {
        map.current.removeImage(iconId);
      }

      if (map.current) {
        // Use same gradient as card: cyan-400 to indigo-500
        const gradientImage = createGradientCircle(
          "rgb(34, 211, 238)",
          "rgb(99, 102, 241)"
        );
        map.current.addImage(iconId, gradientImage, { pixelRatio: 2 });
      }
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
          sessionId: user.id, // Use id as sessionId since they're the same
          city: user.city,
          country: user.country,
          countryCode: user.countryCode,
          startedAt: user.startedAt.toISOString(),
          browser: user.browser,
          deviceType: user.deviceType,
          iconImage: `gradient-circle-${user.id}`, // Assign unique gradient icon
        },
      })),
    };

    source.setData(geojson);
  }, [liveUserLocations]);

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

  const projection = map.current?.getProjection();

  return (
    <div
      className="absolute! inset-0! h-full! w-full! overflow-hidden rounded-lg"
      ref={mapContainer}
    >
      {projection && (
        <div className="pointer-events-none absolute inset-0 h-full w-full bg-bklit-700/50 mix-blend-color" />
      )}
    </div>
  );
}
