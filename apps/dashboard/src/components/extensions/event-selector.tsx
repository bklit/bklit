"use client";

import { Button } from "@bklit/ui/components/button";
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
  onCreateEvent?: () => void;
}

export function EventSelector({
  events,
  selectedEventIds,
  onSelectionChange,
  onCreateEvent,
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
      <div className="space-y-3 rounded-lg border p-4 text-muted-foreground text-sm">
        <p>No custom events defined for this project.</p>
        {onCreateEvent && (
          <Button onClick={onCreateEvent} size="sm">
            Create Your First Event
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="font-semibold text-base">Select Events</Label>
        <Button onClick={handleToggleAll} size="sm" variant="ghost">
          {selectedEventIds.length === events.length
            ? "Deselect All"
            : "Select All"}
        </Button>
      </div>

      <div className="max-h-64 space-y-3 overflow-y-auto rounded-lg border border-border bg-input/50 p-4">
        {events.map((event) => (
          <Label
            className="group flex cursor-pointer items-center justify-between font-medium text-sm"
            htmlFor={event.id}
            key={event.id}
          >
            <div className="flex items-center gap-3">
              <Checkbox
                checked={selectedEventIds.includes(event.id)}
                className="group-hover:border-bklit-400"
                id={event.id}
                onCheckedChange={() => handleToggle(event.id)}
              />
              {event.name}
            </div>
            <span className="font-mono text-muted-foreground text-xs">
              {event.trackingId}
            </span>
          </Label>
        ))}
      </div>
    </div>
  );
}
