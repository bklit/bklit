"use client";

import { Button } from "@bklit/ui/components/button";
import { ButtonGroup } from "@bklit/ui/components/button-group";
import { Calendar as CalendarComponent } from "@bklit/ui/components/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@bklit/ui/components/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@bklit/ui/components/popover";
import { CalendarIcon, ChevronDown, GitCompare } from "lucide-react";
import { parseAsBoolean, parseAsIsoDateTime, useQueryStates } from "nuqs";
import { useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import {
  DATE_PRESETS,
  type DatePreset,
  formatDateRangeDisplay,
} from "@/lib/date-presets";
import { endOfDay, startOfDay } from "@/lib/date-utils";

interface DateRangePickerProps {
  onRangeChange?: (startDate?: Date, endDate?: Date) => void;
}

export function DateRangePicker({ onRangeChange }: DateRangePickerProps) {
  const [dateParams, setDateParams] = useQueryStates({
    startDate: parseAsIsoDateTime,
    endDate: parseAsIsoDateTime,
    compare: parseAsBoolean.withDefault(true),
  });

  const startDate = useMemo(() => {
    if (dateParams.startDate) {
      return dateParams.startDate;
    }
    return undefined;
  }, [dateParams.startDate]);

  const endDate = dateParams.endDate ?? undefined;
  const compare = dateParams.compare;

  const [localRange, setLocalRange] = useState<DateRange | undefined>({
    from: startDate,
    to: endDate,
  });

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  useEffect(() => {
    setLocalRange({
      from: startDate,
      to: endDate,
    });
  }, [startDate, endDate]);

  // Set default to "Last 30 days" if no dates are set
  useEffect(() => {
    if (dateParams.startDate === null && dateParams.endDate === null) {
      const defaultPreset = DATE_PRESETS[0]; // "Last 30 days"
      if (defaultPreset) {
        const { startDate: defaultStart, endDate: defaultEnd } =
          defaultPreset.getValue();

        setDateParams({
          startDate: defaultStart,
          endDate: defaultEnd,
        });
      }
    }
  }, [dateParams.startDate, dateParams.endDate, setDateParams]);

  // Calculate display text
  const displayText = useMemo(() => {
    if (!(startDate && endDate)) {
      return "Select dates";
    }
    return formatDateRangeDisplay(startDate, endDate);
  }, [startDate, endDate]);

  // Check if current dates match default
  const isDefaultRange = useMemo(() => {
    if (!(startDate && endDate)) {
      return false;
    }

    const defaultPreset = DATE_PRESETS[0]; // "Last 30 days"
    if (!defaultPreset) {
      return false;
    }

    const { startDate: defaultStart, endDate: defaultEnd } =
      defaultPreset.getValue();

    const normalizedCurrentStart = startOfDay(startDate);
    const normalizedCurrentEnd = endOfDay(endDate);
    const normalizedDefaultStart = startOfDay(defaultStart);
    const normalizedDefaultEnd = endOfDay(defaultEnd);

    return (
      normalizedCurrentStart.getTime() === normalizedDefaultStart.getTime() &&
      normalizedCurrentEnd.getTime() === normalizedDefaultEnd.getTime()
    );
  }, [startDate, endDate]);

  const hasActiveFilters = !isDefaultRange;

  // Handle preset selection
  const handlePresetSelect = (preset: DatePreset) => {
    const { startDate: presetStart, endDate: presetEnd } = preset.getValue();

    setDateParams({
      startDate: presetStart,
      endDate: presetEnd,
    });
    onRangeChange?.(presetStart, presetEnd);
  };

  // Handle custom date range from calendar
  const applyDateRange = () => {
    const normalizedStartDate = localRange?.from
      ? startOfDay(localRange.from)
      : null;
    const normalizedEndDate = localRange?.to ? endOfDay(localRange.to) : null;

    setDateParams({
      startDate: normalizedStartDate,
      endDate: normalizedEndDate,
    });
    onRangeChange?.(
      normalizedStartDate ?? undefined,
      normalizedEndDate ?? undefined
    );
    setIsCalendarOpen(false);
  };

  // Clear filters (reset to default)
  const clearFilters = () => {
    const defaultPreset = DATE_PRESETS[0]; // "Last 30 days"
    if (!defaultPreset) {
      return;
    }

    const { startDate: defaultStart, endDate: defaultEnd } =
      defaultPreset.getValue();

    setDateParams({
      startDate: defaultStart,
      endDate: defaultEnd,
    });
    setLocalRange({
      from: defaultStart,
      to: defaultEnd,
    });
    onRangeChange?.(defaultStart, defaultEnd);
  };

  const handleCalendarOpenChange = (open: boolean) => {
    if (open) {
      // Sync local state with current filters when opening
      setLocalRange({ from: startDate, to: endDate });
    } else {
      // Reset local state if popover is closed without applying
      setLocalRange({ from: startDate, to: endDate });
    }
    setIsCalendarOpen(open);
  };

  return (
    <ButtonGroup>
      {/* Preset Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="justify-start text-left font-normal"
            size="lg"
            variant="outline"
          >
            <span className="hidden text-sm sm:inline">{displayText}</span>
            <span className="text-sm sm:hidden">
              {displayText.length > 15
                ? `${displayText.substring(0, 15)}...`
                : displayText}
            </span>
            <ChevronDown className="ml-1 size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {DATE_PRESETS.map((preset) => (
            <DropdownMenuItem
              key={preset.label}
              onClick={() => handlePresetSelect(preset)}
            >
              {preset.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Calendar Picker */}
      <Popover onOpenChange={handleCalendarOpenChange} open={isCalendarOpen}>
        <PopoverTrigger asChild>
          <Button size="lg" variant="outline">
            <CalendarIcon className="size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-auto p-0">
          <div className="flex flex-col">
            <CalendarComponent
              initialFocus
              mode="range"
              numberOfMonths={2}
              onSelect={setLocalRange}
              selected={localRange}
            />
            <div className="flex items-center justify-end gap-2 border-t p-3">
              <Button
                onClick={() => setIsCalendarOpen(false)}
                size="sm"
                variant="ghost"
              >
                Cancel
              </Button>
              <Button onClick={applyDateRange} size="sm">
                Apply
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Comparison Toggle */}
      <Button
        aria-label="Toggle comparison"
        onClick={() => setDateParams({ compare: !compare })}
        size="lg"
        variant={compare ? "secondary" : "outline"}
      >
        <GitCompare className="size-4" />
      </Button>

      {/* Clear filters button */}
      {hasActiveFilters && (
        <Button onClick={clearFilters} size="lg" variant="secondary">
          Clear
        </Button>
      )}
    </ButtonGroup>
  );
}
