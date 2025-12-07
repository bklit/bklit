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
  eventLimit: number;
}

/**
 * Plan limits configuration
 * These are used for feature gating and access control
 */
export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  [PlanType.FREE]: {
    projectLimit: 1,
    teamMemberLimit: 1,
    eventLimit: 4000,
  },
  [PlanType.PRO]: {
    projectLimit: 5,
    teamMemberLimit: 5,
    eventLimit: 10000,
  },
};

/**
 * Get plan limits by plan type
 */
export function getPlanLimits(planType: PlanType): PlanLimits {
  return PLAN_LIMITS[planType];
}
