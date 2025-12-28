export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

// Helper to parse ClickHouse DateTime strings as UTC
// ClickHouse returns DateTime as "YYYY-MM-DD HH:MM:SS" without timezone
// We need to append "Z" to treat it as UTC
export function parseClickHouseDate(dateString: string): Date {
  return new Date(`${dateString}Z`);
}

export function getPreviousPeriod(
  startDate: Date,
  endDate: Date,
): { startDate: Date; endDate: Date } {
  const duration = endDate.getTime() - startDate.getTime();

  const prevEndDate = new Date(startDate.getTime() - 1);
  const prevStartDate = new Date(prevEndDate.getTime() - duration);

  return {
    startDate: startOfDay(prevStartDate),
    endDate: endOfDay(prevEndDate),
  };
}
