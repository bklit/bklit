/**
 * Plan Types and Business Logic
 *
 * This file contains only business rules and limits for plans.
 * Display information (name, description, price, features) comes from Polar.
 */

export enum PlanType {
  FREE = "free",
  PRO = "pro",
}

/**
 * Business limits for each plan
 */
export interface PlanLimits {
  projectLimit: number;
  teamMemberLimit: number;
}

/**
 * Plan limits configuration
 * These are used for feature gating and access control
 */
export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  [PlanType.FREE]: {
    projectLimit: 1,
    teamMemberLimit: 1,
  },
  [PlanType.PRO]: {
    projectLimit: 5,
    teamMemberLimit: 5,
  },
};

/**
 * Legacy interface for backward compatibility
 * @deprecated Use PlanLimits and fetch display data from Polar instead
 */
export interface PlanDetails extends PlanLimits {
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: "month" | "year";
  features: string[];
  popular?: boolean;
  polarProductId?: string;
}

/**
 * Get plan limits by plan type
 */
export function getPlanLimits(planType: PlanType): PlanLimits {
  return PLAN_LIMITS[planType];
}

/**
 * Legacy helper function for backward compatibility
 * @deprecated This returns mock data. Fetch real data from Polar instead.
 */
export function getPlanDetails(planId?: string | null): PlanDetails {
  const planType = planId === PlanType.PRO ? PlanType.PRO : PlanType.FREE;
  const limits = PLAN_LIMITS[planType];

  // Return mock data for backward compatibility
  // TODO: Update consumers to fetch from Polar
  return {
    ...limits,
    name: planType === PlanType.PRO ? "Pro" : "Free",
    description: planType === PlanType.PRO ? "Pro plan" : "Free plan",
    price: 0,
    currency: "USD",
    interval: "month",
    features: [],
    popular: planType === PlanType.PRO,
  };
}

/**
 * Helper function to get plan type by Polar product ID
 */
export function getPlanTypeByPolarProductId(polarProductId: string): PlanType {
  // In the future, fetch this mapping from env or Polar
  // For now, any product ID means PRO (since Free has no product)
  return polarProductId ? PlanType.PRO : PlanType.FREE;
}
