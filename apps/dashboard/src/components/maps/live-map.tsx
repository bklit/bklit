"use client";

import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLiveMap } from "@/contexts/live-map-context";
import { useLiveSessions } from "@/hooks/use-live-sessions";
import {
  findCountryCoordinates,
  getCountryCoordinates,
} from "@/lib/maps/country-coordinates";
import { parseRGB } from "@/lib/maps/marker-colors";

interface LiveMapProps {
  projectId: string;
  organizationId: string;
}

// Create a gradient circle marker for individual sessions
function createGradientCircle(
  fromColor: string,
  toColor: string,
  size = 80
): mapboxgl.StyleImageInterface {
  const from = parseRGB(fromColor);
  const to = parseRGB(toColor);

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) {
    return {
      width: size,
      height: size,
      data: new Uint8Array(size * size * 4),
      onAdd() {
        // No-op
      },
      render() {
        return false;
      },
    };
  }

  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size / 2 - 4;

  const gradient = context.createRadialGradient(
    centerX - radius * 0.3,
    centerY - radius * 0.3,
    0,
    centerX,
    centerY,
    radius
  );
  gradient.addColorStop(0, `rgba(${from.r}, ${from.g}, ${from.b}, 1)`);
  gradient.addColorStop(1, `rgba(${to.r}, ${to.g}, ${to.b}, 1)`);

  context.beginPath();
  context.arc(centerX, centerY, radius, 0, Math.PI * 2);
  context.fillStyle = gradient;
  context.fill();

  context.strokeStyle = "rgba(255, 255, 255, 0.95)";
  context.lineWidth = 2;
  context.stroke();

  const imageData = context.getImageData(0, 0, size, size);

  return {
    width: size,
    height: size,
    data: imageData.data,
    onAdd() {
      // No-op - image already drawn
    },
    render() {
      return false;
    },
  };
}

// Create a country group marker with count badge
function createCountryGroupMarker(
  count: number,
  size = 100
): mapboxgl.StyleImageInterface {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) {
    return {
      width: size,
      height: size,
      data: new Uint8Array(size * size * 4),
      onAdd() {
        // No-op
      },
      render() {
        return false;
      },
    };
  }

  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size / 2 - 8;

  // Background gradient (indigo to purple)
  const gradient = context.createRadialGradient(
    centerX - radius * 0.3,
    centerY - radius * 0.3,
    0,
    centerX,
    centerY,
    radius
  );
  gradient.addColorStop(0, "rgba(129, 140, 248, 1)"); // indigo-400
  gradient.addColorStop(1, "rgba(99, 102, 241, 1)"); // indigo-500

  context.beginPath();
  context.arc(centerX, centerY, radius, 0, Math.PI * 2);
  context.fillStyle = gradient;
  context.fill();

  // White border
  context.strokeStyle = "rgba(255, 255, 255, 0.95)";
  context.lineWidth = 3;
  context.stroke();

  // Count text
  context.fillStyle = "white";
  context.font = `bold ${count > 99 ? 20 : 24}px system-ui, sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(count > 99 ? "99+" : String(count), centerX, centerY);

  const imageData = context.getImageData(0, 0, size, size);

  return {
    width: size,
    height: size,
    data: imageData.data,
    onAdd() {
      // No-op - image already drawn
    },
    render() {
      return false;
    },
  };
}

export function LiveMap({ projectId, organizationId }: LiveMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userInteracting = useRef(false);
  const spinEnabled = useRef(true);
  const spinGlobeRef = useRef<(() => void) | null>(null);
  const onMarkerClickRef = useRef<((sessionId: string) => void) | null>(null);
  const addedImagesRef = useRef<Set<string>>(new Set());
  const [mapLoaded, setMapLoaded] = useState(false);

  const { registerCenterFunction, onMarkerClick } = useLiveMap();
  const { individualSessions, countryGroups, isConnected } = useLiveSessions({
    projectId,
    organizationId,
  });

  // Keep ref updated with latest onMarkerClick
  useEffect(() => {
    onMarkerClickRef.current = onMarkerClick;
  }, [onMarkerClick]);

  // Initialize map
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
          const zoomDif = (maxSpinZoom - zoom) / (maxSpinZoom - slowSpinZoom);
          distancePerSecond *= zoomDif;
        }
        const center = map.current.getCenter();
        center.lng -= distancePerSecond;
        map.current.easeTo({ center, duration: 1000, easing: (n) => n });
      }
    };

    spinGlobeRef.current = spinGlobe;

    map.current.on("style.load", () => {
      if (map.current) {
        map.current.setFog(null);
      }
    });

    map.current.on("load", () => {
      if (!map.current) {
        return;
      }

      // Add sources for individual and country group markers
      map.current.addSource("individual-sessions", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.current.addSource("country-groups", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      // Layer for individual session markers
      map.current.addLayer({
        id: "individual-sessions-layer",
        type: "symbol",
        source: "individual-sessions",
        layout: {
          "icon-image": ["get", "iconImage"],
          "icon-size": 0.5,
          "icon-allow-overlap": true,
        },
      });

      // Layer for country group markers
      map.current.addLayer({
        id: "country-groups-layer",
        type: "symbol",
        source: "country-groups",
        layout: {
          "icon-image": ["get", "iconImage"],
          "icon-size": 0.6,
          "icon-allow-overlap": true,
        },
      });

      // Click handler for individual markers
      map.current.on("click", "individual-sessions-layer", (e) => {
        const feature = e.features?.[0];
        if (!feature?.properties) {
          return;
        }
        const sessionId = feature.properties.sessionId as string;
        if (sessionId && onMarkerClickRef.current) {
          onMarkerClickRef.current(sessionId);
        }
      });

      // Click handler for country group markers (future: drill down)
      map.current.on("click", "country-groups-layer", (e) => {
        const feature = e.features?.[0];
        if (!feature?.properties) {
          return;
        }
        const countryCode = feature.properties.countryCode as string;
        // For now, just center on the country
        if (countryCode && map.current) {
          const coords = findCountryCoordinates(countryCode);
          if (coords) {
            map.current.easeTo({
              center: [coords.longitude, coords.latitude],
              zoom: 4,
              duration: 1500,
            });
          }
        }
      });

      // Cursor changes
      const setCursor = (cursor: string) => () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = cursor;
        }
      };

      map.current.on(
        "mouseenter",
        "individual-sessions-layer",
        setCursor("pointer")
      );
      map.current.on("mouseleave", "individual-sessions-layer", setCursor(""));
      map.current.on(
        "mouseenter",
        "country-groups-layer",
        setCursor("pointer")
      );
      map.current.on("mouseleave", "country-groups-layer", setCursor(""));

      setMapLoaded(true);
    });

    // Interaction handlers
    map.current.on("mousedown", () => {
      userInteracting.current = true;
    });

    map.current.on("mouseup", () => {
      userInteracting.current = false;
      spinGlobe();
    });

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

    map.current.on("moveend", () => {
      spinGlobe();
    });

    spinGlobe();

    return () => {
      if (map.current) {
        try {
          map.current.stop();
          map.current.remove();
        } catch {
          // Ignore cleanup errors
        } finally {
          map.current = null;
        }
      }
      spinGlobeRef.current = null;
      addedImagesRef.current.clear();
    };
  }, []);

  // Update individual session markers
  useEffect(() => {
    const mapInstance = map.current;
    if (!mapInstance) {
      return;
    }
    if (!mapLoaded) {
      return;
    }

    const source = mapInstance.getSource("individual-sessions") as
      | mapboxgl.GeoJSONSource
      | undefined;
    if (!source) {
      return;
    }

    // Create/update marker images for each session
    for (const session of individualSessions) {
      const iconId = `session-${session.id}`;

      if (!addedImagesRef.current.has(iconId)) {
        // Create gradient marker for visual appeal
        const markerImage = createGradientCircle(
          session.gradient.from,
          session.gradient.to
        );

        if (!mapInstance.hasImage(iconId)) {
          mapInstance.addImage(iconId, markerImage, { pixelRatio: 2 });
          addedImagesRef.current.add(iconId);
        }
      }
    }

    // Build GeoJSON for individual sessions
    const geojson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: individualSessions.map((session) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: session.coordinates,
        },
        properties: {
          sessionId: session.id,
          city: session.city,
          country: session.country,
          countryCode: session.countryCode,
          iconImage: `session-${session.id}`,
        },
      })),
    };

    source.setData(geojson);
  }, [individualSessions, mapLoaded]);

  // Update country group markers
  useEffect(() => {
    const mapInstance = map.current;
    if (!mapInstance) {
      return;
    }
    if (!mapLoaded) {
      return;
    }

    const source = mapInstance.getSource("country-groups") as
      | mapboxgl.GeoJSONSource
      | undefined;
    if (!source) {
      return;
    }

    // Create/update marker images for each country group
    for (const group of countryGroups) {
      const iconId = `country-${group.countryCode}-${group.sessions.length}`;

      // Remove old versions with different counts
      const oldIconPattern = `country-${group.countryCode}-`;
      for (const existingId of addedImagesRef.current) {
        if (existingId.startsWith(oldIconPattern) && existingId !== iconId) {
          if (mapInstance.hasImage(existingId)) {
            mapInstance.removeImage(existingId);
          }
          addedImagesRef.current.delete(existingId);
        }
      }

      if (!mapInstance.hasImage(iconId)) {
        const markerImage = createCountryGroupMarker(group.sessions.length);
        mapInstance.addImage(iconId, markerImage, { pixelRatio: 2 });
        addedImagesRef.current.add(iconId);
      }
    }

    // Build GeoJSON for country groups
    const geojson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: countryGroups.map((group) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: group.coordinates,
        },
        properties: {
          countryCode: group.countryCode,
          countryName: group.countryName,
          sessionCount: group.sessions.length,
          iconImage: `country-${group.countryCode}-${group.sessions.length}`,
        },
      })),
    };

    source.setData(geojson);
  }, [countryGroups, mapLoaded]);

  // Center on country function
  const centerOnCountry = useCallback(
    (countryCode: string | null, countryName?: string | null) => {
      if (!map.current) {
        return;
      }
      if (!countryCode) {
        return;
      }

      let coordinates = findCountryCoordinates(countryCode);

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

      spinEnabled.current = false;
      userInteracting.current = true;

      map.current.easeTo({
        center: [coordinates.longitude, coordinates.latitude],
        zoom: 4,
        duration: 2000,
        easing: (t) => t * (2 - t),
      });

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

  // Register center function with context
  useEffect(() => {
    registerCenterFunction(centerOnCountry);
  }, [registerCenterFunction, centerOnCountry]);

  return (
    <div
      className="absolute! inset-0! h-full! w-full! overflow-hidden rounded-lg"
      ref={mapContainer}
    >
      {mapLoaded && (
        <div className="pointer-events-none absolute inset-0 h-full w-full bg-bklit-700/50 mix-blend-color" />
      )}
      {/* Real-time connection indicator */}
      <div className="absolute top-4 right-4 z-10">
        <div
          className={`size-2 rounded-full ${isConnected ? "bg-green-500" : "bg-yellow-500"}`}
          title={isConnected ? "Real-time connected" : "Polling mode"}
        />
      </div>
    </div>
  );
}
