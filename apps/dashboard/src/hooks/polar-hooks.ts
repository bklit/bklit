"use client";

import { getPlanLimits, PlanType } from "@/lib/plans";

export function useCanCreateProject(organization: {
  plan?: string;
  projects?: unknown[];
}) {
  const planId = (organization?.plan as PlanType) || PlanType.FREE;
  const planLimits = getPlanLimits(planId);
  const projectCount = organization?.projects?.length ?? 0;
  const hasReachedProjectLimit = projectCount >= planLimits.projectLimit;

  return {
    canCreate: !hasReachedProjectLimit,
    reason: hasReachedProjectLimit
      ? `Team has reached the limit of ${planLimits.projectLimit} projects on the ${planId} plan`
      : null,
    planLimits,
    currentCount: projectCount,
    isLoading: false,
  };
}

export function useCanAddTeamMember(organization: {
  plan?: string;
  members?: unknown[];
}) {
  const planId = (organization?.plan as PlanType) || PlanType.FREE;
  const planLimits = getPlanLimits(planId);
  const memberCount = organization?.members?.length ?? 0;
  const hasReachedMemberLimit = memberCount >= planLimits.teamMemberLimit;

  return {
    canAdd: !hasReachedMemberLimit,
    reason: hasReachedMemberLimit
      ? `Team has reached the limit of ${planLimits.teamMemberLimit} members on the ${planId} plan`
      : null,
    planLimits,
    currentCount: memberCount,
    isLoading: false,
  };
}
