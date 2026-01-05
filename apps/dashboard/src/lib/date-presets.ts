import {
  differenceInDays,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  isSameYear,
  isToday,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
} from "date-fns";
import { endOfDay, startOfDay } from "./date-utils";

export interface DatePreset {
  label: string;
  getValue: () => { startDate: Date; endDate: Date };
}

export const DATE_PRESETS: DatePreset[] = [
  {
    label: "Last 30 days",
    getValue: () => {
      const endDate = endOfDay(new Date());
      const startDate = startOfDay(subDays(new Date(), 30));
      return { startDate, endDate };
    },
  },
  {
    label: "Today",
    getValue: () => {
      const today = new Date();
      return {
        startDate: startOfDay(today),
        endDate: endOfDay(today),
      };
    },
  },
  {
    label: "Yesterday",
    getValue: () => {
      const yesterday = subDays(new Date(), 1);
      return {
        startDate: startOfDay(yesterday),
        endDate: endOfDay(yesterday),
      };
    },
  },
  {
    label: "This Week",
    getValue: () => {
      const today = new Date();
      const monday = startOfWeek(today, { weekStartsOn: 1 });
      return {
        startDate: startOfDay(monday),
        endDate: endOfDay(today),
      };
    },
  },
  {
    label: "This Month",
    getValue: () => {
      const today = new Date();
      const firstOfMonth = startOfMonth(today);
      return {
        startDate: startOfDay(firstOfMonth),
        endDate: endOfDay(today),
      };
    },
  },
  {
    label: "Last Month",
    getValue: () => {
      const lastMonth = subMonths(new Date(), 1);
      const firstOfLastMonth = startOfMonth(lastMonth);
      const lastOfLastMonth = endOfMonth(lastMonth);
      return {
        startDate: startOfDay(firstOfLastMonth),
        endDate: endOfDay(lastOfLastMonth),
      };
    },
  },
  {
    label: "Last 3 Months",
    getValue: () => {
      const endDate = endOfDay(new Date());
      const startDate = startOfDay(subMonths(new Date(), 3));
      return { startDate, endDate };
    },
  },
  {
    label: "This Year",
    getValue: () => {
      const today = new Date();
      const firstOfYear = startOfYear(today);
      return {
        startDate: startOfDay(firstOfYear),
        endDate: endOfDay(today),
      };
    },
  },
];

export function getPresetForDates(
  startDate: Date,
  endDate: Date,
): string | null {
  const normalizedStart = startOfDay(startDate);
  const normalizedEnd = endOfDay(endDate);

  for (const preset of DATE_PRESETS) {
    const { startDate: presetStart, endDate: presetEnd } = preset.getValue();
    const presetStartNormalized = startOfDay(presetStart);
    const presetEndNormalized = endOfDay(presetEnd);

    if (
      isSameDay(normalizedStart, presetStartNormalized) &&
      isSameDay(normalizedEnd, presetEndNormalized)
    ) {
      return preset.label;
    }
  }

  return null;
}

export function formatDateRangeDisplay(startDate: Date, endDate: Date): string {
  const normalizedStart = startOfDay(startDate);
  const normalizedEnd = endOfDay(endDate);

  // 1. Check if dates match a preset
  const presetLabel = getPresetForDates(normalizedStart, normalizedEnd);
  if (presetLabel) {
    return presetLabel;
  }

  // 2. If start and end are both today
  if (isToday(normalizedStart) && isToday(normalizedEnd)) {
    return "Today";
  }

  // 3. If end date is today - calculate relative format
  if (isToday(normalizedEnd)) {
    const daysDiff = differenceInDays(normalizedEnd, normalizedStart);

    if (daysDiff === 1) {
      return "Yesterday";
    }

    if (daysDiff === 7) {
      return "Last 7 days";
    }

    if (daysDiff === 14) {
      return "Last 14 days";
    }

    if (daysDiff > 1) {
      return `Last ${daysDiff} days`;
    }
  }

  // 4. If start is 1st of current month and end is today
  const firstOfCurrentMonth = startOfMonth(new Date());
  if (
    isSameDay(normalizedStart, firstOfCurrentMonth) &&
    isToday(normalizedEnd)
  ) {
    return format(new Date(), "MMMM yyyy");
  }

  const today = new Date();
  const isCurrentYear = isSameYear(normalizedStart, today);

  // 5. If same month
  if (isSameMonth(normalizedStart, normalizedEnd)) {
    const startDay = format(normalizedStart, "d");
    const endDay = format(normalizedEnd, "d");
    const month = format(normalizedEnd, "MMM");
    const year = isSameYear(normalizedEnd, today)
      ? ""
      : ` '${format(normalizedEnd, "yy")}`;

    return `${startDay} - ${endDay} ${month}${year}`;
  }

  // 6. If different months, same year
  if (isSameYear(normalizedStart, normalizedEnd)) {
    const startFormatted = format(normalizedStart, "d MMM");
    const endFormatted = format(normalizedEnd, "d MMM");
    const year = isCurrentYear ? "" : ` '${format(normalizedEnd, "yy")}`;

    return `${startFormatted} - ${endFormatted}${year}`;
  }

  // 7. Different years
  const startFormatted = format(normalizedStart, "d MMM ''yy");
  const endFormatted = format(normalizedEnd, "d MMM ''yy");

  return `${startFormatted} - ${endFormatted}`;
}
