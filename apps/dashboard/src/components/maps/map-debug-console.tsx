"use client";

import { cn } from "@bklit/ui/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Activity, ChevronDown, ChevronUp, X } from "lucide-react";
import { useState } from "react";
import {
  type MapEvent,
  type MapEventType,
  useMapEvents,
} from "@/hooks/use-map-events";

export function MapDebugConsole() {
  const { events, clearEvents } = useMapEvents();
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedEventIds, setExpandedEventIds] = useState<Set<string>>(
    new Set()
  );

  const toggleEventExpansion = (eventId: string) => {
    setExpandedEventIds((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  if (!isExpanded) {
    return (
      <div className="fixed right-4 bottom-4 z-50">
        <button
          className="flex items-center gap-2 rounded-lg bg-bklit-800/95 px-3 py-2 text-bklit-200 shadow-lg backdrop-blur-sm transition-colors hover:bg-bklit-700/95"
          onClick={() => setIsExpanded(true)}
        >
          <Activity className="size-4" />
          <span className="font-medium text-xs">Map Events</span>
          {events.length > 0 && (
            <span className="rounded-full bg-indigo-500 px-1.5 py-0.5 font-semibold text-white text-xs">
              {events.length}
            </span>
          )}
          <ChevronUp className="size-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed right-4 bottom-4 z-50 flex w-96 flex-col rounded-lg bg-bklit-800/95 shadow-xl backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-bklit-700 border-b px-3 py-2">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-indigo-400" />
          <span className="font-semibold text-bklit-100 text-sm">
            Map Events
          </span>
          {events.length > 0 && (
            <span className="rounded-full bg-bklit-700 px-1.5 py-0.5 font-medium text-bklit-300 text-xs">
              {events.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            className="rounded p-1 text-bklit-400 transition-colors hover:bg-bklit-700 hover:text-bklit-200"
            onClick={clearEvents}
            title="Clear events"
          >
            <X className="size-3.5" />
          </button>
          <button
            className="rounded p-1 text-bklit-400 transition-colors hover:bg-bklit-700 hover:text-bklit-200"
            onClick={() => setIsExpanded(false)}
            title="Minimize"
          >
            <ChevronDown className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Events List */}
      <div className="max-h-96 overflow-y-auto">
        {events.length === 0 ? (
          <div className="py-8 text-center text-bklit-500 text-xs">
            No events yet. Interact with the map to see events.
          </div>
        ) : (
          <div className="space-y-px p-2">
            {events.map((event) => (
              <EventItem
                event={event}
                isExpanded={expandedEventIds.has(event.id)}
                key={event.id}
                onToggle={() => toggleEventExpansion(event.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EventItem({
  event,
  isExpanded,
  onToggle,
}: {
  event: MapEvent;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const hasData = event.data && Object.keys(event.data).length > 0;

  return (
    <div
      className={cn(
        "rounded-md border border-transparent px-2 py-1.5 transition-colors hover:border-bklit-700 hover:bg-bklit-700/50",
        isExpanded && "bg-bklit-700/30"
      )}
    >
      <button
        className="w-full text-left"
        disabled={!hasData}
        onClick={onToggle}
      >
        <div className="flex items-start gap-2">
          <span className="text-sm" title={event.type}>
            {getEventIcon(event.type)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-bklit-400 text-xs">
                {formatDistanceToNow(event.timestamp, { addSuffix: true })}
              </span>
              <span className="font-medium text-bklit-200 text-xs">
                {getEventLabel(event.type)}
              </span>
            </div>
            <p className="truncate text-bklit-300 text-xs">{event.message}</p>
          </div>
          {hasData && (
            <ChevronDown
              className={cn(
                "size-3 flex-shrink-0 text-bklit-500 transition-transform",
                isExpanded && "rotate-180"
              )}
            />
          )}
        </div>
      </button>

      {/* Expanded Data */}
      {isExpanded && hasData && (
        <div className="mt-2 rounded border border-bklit-700 bg-bklit-900/50 p-2">
          <pre className="overflow-x-auto font-mono text-bklit-300 text-xs">
            {JSON.stringify(event.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
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

function getEventLabel(type: MapEventType): string {
  switch (type) {
    case "marker_clicked":
      return "Marker Clicked";
    case "country_clicked":
      return "Country Clicked";
    case "session_added":
      return "Session Added";
    case "session_updated":
      return "Session Updated";
    case "session_ended":
      return "Session Ending";
    case "session_removed":
      return "Session Removed";
    case "country_expanded":
      return "Country Expanded";
    case "country_collapsed":
      return "Country Collapsed";
    case "marker_image_added":
      return "Marker Created";
    case "marker_image_removed":
      return "Marker Cleaned";
    case "zoom_to_country":
      return "Zoom to Country";
    case "error":
      return "Error";
    default:
      return type;
  }
}
