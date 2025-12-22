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
import { useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { endOfDay, startOfDay } from "@/lib/date-utils";

interface DateRangePickerProps {
  onRangeChange?: (startDate?: Date, endDate?: Date) => void;
}

export function DateRangePicker({ onRangeChange }: DateRangePickerProps) {
  const [dateParams, setDateParams] = useQueryStates({
    startDate: parseAsIsoDateTime,
    endDate: parseAsIsoDateTime,
  });

  const startDate = useMemo(() => {
    if (dateParams.startDate) return dateParams.startDate;
    return undefined;
  }, [dateParams.startDate]);

  const endDate = dateParams.endDate ?? undefined;

  const [localRange, setLocalRange] = useState<DateRange | undefined>({
    from: startDate,
    to: endDate,
  });

  useEffect(() => {
    setLocalRange({
      from: startDate,
      to: endDate,
    });
  }, [startDate, endDate]);

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (dateParams.startDate === null && dateParams.endDate === null) {
      const defaultEndDate = endOfDay(new Date());
      const defaultStartDate = startOfDay(new Date());
      defaultStartDate.setDate(defaultStartDate.getDate() - 30);

      setDateParams({
        startDate: defaultStartDate,
        endDate: defaultEndDate,
      });
    }
  }, [dateParams.startDate, dateParams.endDate, setDateParams]);

  const isDefaultRange = useMemo(() => {
    if (!(dateParams.startDate && dateParams.endDate)) return false;

    const today = new Date();
    const defaultEndDate = endOfDay(today);
    const defaultStartDate = startOfDay(today);
    defaultStartDate.setDate(defaultStartDate.getDate() - 30);

    const normalizedCurrentStart = startOfDay(dateParams.startDate);
    const normalizedCurrentEnd = endOfDay(dateParams.endDate);

    const defaultStartDateStr = defaultStartDate.toISOString().split("T")[0];
    const defaultEndDateStr = defaultEndDate.toISOString().split("T")[0];
    const currentStartDateStr = normalizedCurrentStart
      .toISOString()
      .split("T")[0];
    const currentEndDateStr = normalizedCurrentEnd.toISOString().split("T")[0];

    return (
      currentStartDateStr === defaultStartDateStr &&
      currentEndDateStr === defaultEndDateStr
    );
  }, [dateParams.startDate, dateParams.endDate]);

  const hasActiveFilters = !isDefaultRange;

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
    setIsOpen(false);
  };

  const clearFilters = () => {
    const defaultEndDate = endOfDay(new Date());
    const defaultStartDate = startOfDay(new Date());
    defaultStartDate.setDate(defaultStartDate.getDate() - 30);

    setDateParams({
      startDate: defaultStartDate,
      endDate: defaultEndDate,
    });
    setLocalRange({
      from: defaultStartDate,
      to: defaultEndDate,
    });
    onRangeChange?.(defaultStartDate, defaultEndDate);
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      // Sync local state with current filters when opening
      setLocalRange({ from: startDate, to: endDate });
    } else {
      // Reset local state if popover is closed without applying
      setLocalRange({ from: startDate, to: endDate });
    }
    setIsOpen(open);
  };

  return (
    <ButtonGroup>
      <Popover onOpenChange={handleOpenChange} open={isOpen}>
        <PopoverTrigger asChild>
          <Button
            className="justify-start text-left font-normal"
            size="lg"
            variant="outline"
          >
            <CalendarIcon className="size-4" />
            <span className="hidden text-sm sm:inline">
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
            </span>
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
                onClick={() => setIsOpen(false)}
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
      {hasActiveFilters && (
        <Button onClick={clearFilters} size="lg" variant="secondary">
          Clear filters
        </Button>
      )}
    </ButtonGroup>
  );
}
