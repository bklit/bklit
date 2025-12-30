"use client";

import { Checkbox } from "@bklit/ui/components/checkbox";
import { Label } from "@bklit/ui/components/label";

interface EventDefinition {
  id: string;
  name: string;
  description?: string | null;
  trackingId: string;
}

interface EventSelectorProps {
  events: EventDefinition[];
  selectedEventIds: string[];
  onSelectionChange: (eventIds: string[]) => void;
}

export function EventSelector({
  events,
  selectedEventIds,
  onSelectionChange,
}: EventSelectorProps) {
  const handleToggle = (eventId: string) => {
    const newSelection = selectedEventIds.includes(eventId)
      ? selectedEventIds.filter((id) => id !== eventId)
      : [...selectedEventIds, eventId];
    onSelectionChange(newSelection);
  };

  const handleToggleAll = () => {
    if (selectedEventIds.length === events.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(events.map((e) => e.id));
    }
  };

  if (events.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-4 border rounded-lg">
        No custom events defined for this project.{" "}
        <a
          href="../events"
          className="text-primary hover:underline"
        >
          Create one
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Select Events to Trigger</Label>
        <button
          type="button"
          onClick={handleToggleAll}
          className="text-sm text-primary hover:underline"
        >
          {selectedEventIds.length === events.length ? "Deselect All" : "Select All"}
        </button>
      </div>

      <div className="space-y-2 border rounded-lg p-4 max-h-64 overflow-y-auto">
        {events.map((event) => (
          <div key={event.id} className="flex items-start space-x-2">
            <Checkbox
              id={event.id}
              checked={selectedEventIds.includes(event.id)}
              onCheckedChange={() => handleToggle(event.id)}
            />
            <div className="flex-1">
              <Label
                htmlFor={event.id}
                className="text-sm font-medium cursor-pointer"
              >
                {event.name}
              </Label>
              {event.description && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {event.description}
                </p>
              )}
              <p className="text-xs text-muted-foreground/70 mt-0.5">
                Tracking ID: {event.trackingId}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

