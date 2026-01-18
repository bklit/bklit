"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

export type MapEventType =
  | "marker_clicked"
  | "country_clicked"
  | "session_added"
  | "session_updated"
  | "session_ended"
  | "session_removed"
  | "country_expanded"
  | "country_collapsed"
  | "marker_image_added"
  | "marker_image_removed"
  | "zoom_to_country"
  | "error";

export interface MapEvent {
  id: string;
  type: MapEventType;
  message: string;
  data?: Record<string, unknown>;
  timestamp: Date;
}

interface MapEventsContextValue {
  events: MapEvent[];
  logEvent: (
    type: MapEventType,
    message: string,
    data?: Record<string, unknown>
  ) => void;
  clearEvents: () => void;
}

const MapEventsContext = createContext<MapEventsContextValue | null>(null);

const MAX_EVENTS = 100;

export function MapEventsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<MapEvent[]>([]);
  const eventIdCounter = useRef(0);

  const logEvent = useCallback(
    (type: MapEventType, message: string, data?: Record<string, unknown>) => {
      const event: MapEvent = {
        id: `event-${Date.now()}-${eventIdCounter.current++}`,
        type,
        message,
        data,
        timestamp: new Date(),
      };

      // Log to browser console in development
      if (process.env.NODE_ENV === "development") {
        const icon = getEventIcon(type);
        console.log(`${icon} [MapEvent] ${type}:`, message, data || "");
      }

      setEvents((prev) => {
        const newEvents = [event, ...prev];
        return newEvents.slice(0, MAX_EVENTS);
      });
    },
    []
  );

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  return (
    <MapEventsContext.Provider value={{ events, logEvent, clearEvents }}>
      {children}
    </MapEventsContext.Provider>
  );
}

export function useMapEvents() {
  const context = useContext(MapEventsContext);
  if (!context) {
    // Return no-op functions for SSR/build
    return {
      events: [],
      logEvent: () => {},
      clearEvents: () => {},
    };
  }
  return context;
}

function getEventIcon(type: MapEventType): string {
  switch (type) {
    case "session_added":
    case "marker_image_added":
      return "🟢";
    case "session_removed":
    case "marker_image_removed":
      return "🔴";
    case "marker_clicked":
    case "country_clicked":
      return "🔵";
    case "session_ended":
    case "session_updated":
    case "country_expanded":
    case "country_collapsed":
    case "zoom_to_country":
      return "🟡";
    case "error":
      return "❌";
    default:
      return "⚪";
  }
}
