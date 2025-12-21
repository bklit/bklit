/**
 * Pricing utilities
 * NOTE: Pricing data is now fetched from Polar API
 * This file kept for legacy compatibility only
 */

export interface PricingPlan {
  name: string;
  description: string;
  price: number;
  interval: "month";
  slug: string;
  polarProductId: string | null;
  eventLimit: number;
  isPopular?: boolean;
  benefits: string[];
}

/**
 * @deprecated Use Polar API instead: fetch('/api/pricing/products')
 * This function returns empty array - update website to use Polar API
 */
export function getPricingPlans(): PricingPlan[] {
  console.warn(
    "getPricingPlans() is deprecated - use Polar API /api/pricing/products instead",
  );
  return [];
}

export function getPricingPlanBySlug(slug: string): PricingPlan | undefined {
  return undefined;
}

export function getPricingPlanByEventLimit(
  eventLimit: number,
): PricingPlan | undefined {
  return undefined;
}

export function getProductIdForPlan(slug: string): string | null {
  return null;
}

export function getRecommendedUpgradeTier(
  currentEventLimit: number,
  currentUsage: number,
): PricingPlan | undefined {
  return undefined;
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price / 100); // Prices are stored in cents
}

export function getPlanLimits(planSlug: string) {
  // For now, return defaults
  // This should be fetched from Polar metadata
  return {
    eventLimit: 1000,
    projectLimit: 1,
    teamMemberLimit: 1,
  };
}
