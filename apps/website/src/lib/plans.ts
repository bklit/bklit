export enum PlanType {
  FREE = "free",
  PRO = "pro",
}

export interface PlanDetails {
  name: string;
  description: string;
  projectLimit: number;
  teamMemberLimit: number;
  price: number;
  currency: string;
  interval: "month" | "year";
  features: string[];
  popular?: boolean;
}

export const PLAN_DETAILS: Record<PlanType, PlanDetails> = {
  [PlanType.FREE]: {
    name: "Free",
    description: "Perfect for getting started",
    projectLimit: 1,
    teamMemberLimit: 1,
    price: 0,
    currency: "USD",
    interval: "month",
    features: [
      "4,000 events per month",
      "1 project",
      "1 team member",
      "Real-time analytics",
      "Funnel analysis",
      "Custom event tracking",
      "API access",
      "Community support",
    ],
  },
  [PlanType.PRO]: {
    name: "Pro",
    description: "For growing businesses",
    projectLimit: 999999,
    teamMemberLimit: 999999,
    price: 3000,
    currency: "USD",
    interval: "month",
    features: [
      "100,000 events per month",
      "then $0.0004 per event",
      "Unlimited projects",
      "Unlimited team members",
      "All analytics features",
      "Funnel analysis",
      "Priority support - Discord",
      "Realtime analytics",
    ],
    popular: true,
  },
};

export function getPlanDetails(planId?: string | null): PlanDetails {
  if (planId === PlanType.PRO) {
    return PLAN_DETAILS[PlanType.PRO];
  }
  return PLAN_DETAILS[PlanType.FREE];
}

export function getPlanTypeByPolarProductId(polarProductId: string): PlanType {
  return PlanType.FREE;
}
