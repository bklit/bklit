export enum PlanType {
  FREE = "free",
  PRO = "pro",
}

export interface PlanLimits {
  projectLimit: number;
  teamMemberLimit: number;
  eventLimit: number;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  [PlanType.FREE]: {
    projectLimit: 1,
    teamMemberLimit: 1,
    eventLimit: 4000,
  },
  [PlanType.PRO]: {
    projectLimit: 999999,
    teamMemberLimit: 999999,
    eventLimit: 100000,
  },
};

export function getPlanLimits(planType: PlanType): PlanLimits {
  return PLAN_LIMITS[planType] || PLAN_LIMITS[PlanType.FREE];
}
