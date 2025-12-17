export function formatInvoiceDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function calculateDaysUntil(date: Date): number {
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function formatPrice(amount: number, currency: string = "usd"): string {
  // Amount from Polar is in cents, convert to dollars
  const dollars = amount / 100;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(dollars);
}

export function formatDaysUntil(days: number): string {
  if (days < 0) {
    return "Overdue";
  }
  if (days === 0) {
    return "Due today";
  }
  if (days === 1) {
    return "Due in 1 day";
  }
  return `Due in ${days} days`;
}
