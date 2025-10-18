"use client";

import { Button } from "@bklit/ui/components/button";
import { ButtonGroup } from "@bklit/ui/components/button-group";
import { Calendar as CalendarComponent } from "@bklit/ui/components/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@bklit/ui/components/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { parseAsIsoDateTime, useQueryStates } from "nuqs";
import { useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";

interface DateRangePickerProps {
  onRangeChange?: (startDate?: Date, endDate?: Date) => void;
}

export function DateRangePicker({ onRangeChange }: DateRangePickerProps) {
  const [dateParams, setDateParams] = useQueryStates(
    {
      startDate: parseAsIsoDateTime,
      endDate: parseAsIsoDateTime,
    },
    {
      history: "push",
    },
  );

  const startDate = useMemo(() => {
    if (dateParams.startDate) return dateParams.startDate;
    if (!dateParams.endDate) return undefined;
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  }, [dateParams.startDate, dateParams.endDate]);

  const endDate = dateParams.endDate ?? undefined;

  // Local state for the calendar selection
  const [localRange, setLocalRange] = useState<DateRange | undefined>({
    from: startDate,
    to: endDate,
  });

  const [isOpen, setIsOpen] = useState(false);

  const hasActiveFilters =
    dateParams.startDate !== null || dateParams.endDate !== null;

  const applyDateRange = () => {
    setDateParams({
      startDate: localRange?.from ?? null,
      endDate: localRange?.to ?? null,
    });
    onRangeChange?.(localRange?.from, localRange?.to);
    setIsOpen(false);
  };

  const clearFilters = () => {
    setDateParams({ startDate: null, endDate: null });
    setLocalRange({ from: undefined, to: undefined });
    onRangeChange?.(undefined, undefined);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset local state if popover is closed without applying
      setLocalRange({ from: startDate, to: endDate });
    } else {
      // Sync local state with current filters when opening
      setLocalRange({ from: startDate, to: endDate });
    }
    setIsOpen(open);
  };

  return (
    <ButtonGroup>
      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="lg"
            className="justify-start text-left font-normal"
          >
            <CalendarIcon className="mr-2 size-4" />
            {startDate && endDate ? (
              <>
                {format(startDate, "MMM dd, yyyy")} -{" "}
                {format(endDate, "MMM dd, yyyy")}
              </>
            ) : startDate ? (
              <>{format(startDate, "MMM dd, yyyy")} - Now</>
            ) : (
              "All time"
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <div className="flex flex-col">
            <CalendarComponent
              mode="range"
              selected={localRange}
              onSelect={setLocalRange}
              numberOfMonths={2}
              initialFocus
            />
            <div className="flex items-center justify-end gap-2 p-3 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={applyDateRange}>
                Apply
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {hasActiveFilters && (
        <Button variant="secondary" size="lg" onClick={clearFilters}>
          Clear filters
        </Button>
      )}
    </ButtonGroup>
  );
}
