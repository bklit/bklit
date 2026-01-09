export function calculateLast24Hours() {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setHours(startDate.getHours() - 24);

  return { startDate, endDate };
}

export function calculatePercentage(value: number, total: number): number {
  if (total === 0) {
    return 0;
  }
  return Math.round((value / total) * 1000) / 10; // Round to 1 decimal
}

export function formatPeriod(startDate: Date, endDate: Date) {
  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };
}
