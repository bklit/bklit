"use client";

import { getPlanDetails, PlanType } from "@/lib/plans";

// Simplified hooks that don't make API calls
// These can be used when Polar integration is fully implemented

// Hook for checking if team can create more projects
// Uses organization data from context instead of API calls
export function useCanCreateProject(organization: {
  plan?: string;
  projects?: unknown[];
}) {
  const planId = (organization?.plan as PlanType) || PlanType.FREE;
  const planDetails = getPlanDetails(planId);
  const projectCount = organization?.projects?.length ?? 0;
  const hasReachedProjectLimit = projectCount >= planDetails.projectLimit;

  return {
    canCreate: !hasReachedProjectLimit,
    reason: hasReachedProjectLimit
      ? `Team has reached the limit of ${planDetails.projectLimit} projects on the ${planDetails.name} plan`
      : null,
    planDetails,
    currentCount: projectCount,
    isLoading: false,
  };
}

// Hook for checking if team can add more team members
// Uses organization data from context instead of API calls
export function useCanAddTeamMember(organization: {
  plan?: string;
  members?: unknown[];
}) {
  const planId = (organization?.plan as PlanType) || PlanType.FREE;
  const planDetails = getPlanDetails(planId);
  const memberCount = organization?.members?.length ?? 0;
  const hasReachedMemberLimit = memberCount >= planDetails.teamMemberLimit;

  return {
    canAdd: !hasReachedMemberLimit,
    reason: hasReachedMemberLimit
      ? `Team has reached the limit of ${planDetails.teamMemberLimit} members on the ${planDetails.name} plan`
      : null,
    planDetails,
    currentCount: memberCount,
    isLoading: false,
  };
}
