import { PlanType } from "./plans";

/**
 * Organization plan utility functions
 * These functions help work with organization plan data consistently
 */

export function getOrganizationPlan(organization: { plan?: string }): PlanType {
  return (organization?.plan as PlanType) || PlanType.FREE;
}

export function isOrganizationPro(organization: { plan?: string }): boolean {
  return getOrganizationPlan(organization) === PlanType.PRO;
}

export function getOrganizationPlanName(organization: {
  plan?: string;
}): string {
  const plan = getOrganizationPlan(organization);
  return plan === PlanType.PRO ? "Pro" : "Free";
}

export function getOrganizationPlanDisplayName(organization: {
  plan?: string;
}): string {
  const plan = getOrganizationPlan(organization);
  return plan === PlanType.PRO ? "Pro Plan" : "Free Plan";
}
