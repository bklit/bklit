"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPlanDetails, PlanType } from "@/lib/plans";

// Hook for team subscription data
export function useTeamSubscription(teamId: string) {
  return useQuery({
    queryKey: ["teamSubscription", teamId],
    queryFn: async () => {
      const response = await fetch(
        `/api/polar/team-subscription?teamId=${teamId}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch team subscription");
      }
      // biome-ignore lint/suspicious/noExplicitAny: Polar pricing table
      return response.json() as Promise<any | null>;
    },
    enabled: !!teamId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook for subscription plans
export function useSubscriptionPlans() {
  return useQuery({
    queryKey: ["subscriptionPlans"],
    queryFn: async () => {
      const response = await fetch("/api/polar/subscription-plans");
      if (!response.ok) {
        throw new Error("Failed to fetch subscription plans");
      }
      // biome-ignore lint/suspicious/noExplicitAny: Polar pricing table
      return response.json() as Promise<any[]>;
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

// Hook for team plan status with subscription data
export function useTeamPlanStatusWithSubscription(teamId: string) {
  const { data: subscription, isLoading: isLoadingSubscription } =
    useTeamSubscription(teamId);

  // Get team plan from context or API
  const { data: teamData } = useQuery({
    queryKey: ["teamPlanStatus", teamId],
    queryFn: async () => {
      const response = await fetch(`/api/teams/${teamId}/plan-status`);
      if (!response.ok) {
        throw new Error("Failed to fetch team plan status");
      }
      return response.json();
    },
    enabled: !!teamId,
  });

  const currentPlanId = (teamData?.plan as PlanType) || PlanType.FREE;
  const _currentPlanDetails = getPlanDetails(currentPlanId);

  // Determine effective plan based on subscription
  const effectivePlanId =
    subscription?.status === "active" ? PlanType.PRO : currentPlanId;
  const effectivePlanDetails = getPlanDetails(effectivePlanId);

  return {
    planId: effectivePlanId,
    planDetails: effectivePlanDetails,
    subscription,
    isLoading: isLoadingSubscription,
    hasActiveSubscription: subscription?.status === "active",
    subscriptionEndDate: subscription?.currentPeriodEnd,
    isCanceled: subscription?.cancelAtPeriodEnd,
    projectCount: teamData?.projectCount ?? 0,
    memberCount: teamData?.memberCount ?? 0,
    hasReachedProjectLimit:
      (teamData?.projectCount ?? 0) >= effectivePlanDetails.projectLimit,
    hasReachedMemberLimit:
      (teamData?.memberCount ?? 0) >= effectivePlanDetails.teamMemberLimit,
  };
}

// Hook for syncing Polar data
export function usePolarSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/polar/sync", { method: "POST" });
      if (!response.ok) {
        throw new Error("Failed to sync Polar data");
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["teamSubscription"] });
      queryClient.invalidateQueries({ queryKey: ["subscriptionPlans"] });
      queryClient.invalidateQueries({ queryKey: ["teamPlanStatus"] });
    },
  });
}

// Hook for checking if team can create more projects
export function useCanCreateProject(teamId: string) {
  const teamPlanStatus = useTeamPlanStatusWithSubscription(teamId);

  return {
    canCreate: !teamPlanStatus.hasReachedProjectLimit,
    reason: teamPlanStatus.hasReachedProjectLimit
      ? `Team has reached the limit of ${teamPlanStatus.planDetails.projectLimit} projects on the ${teamPlanStatus.planDetails.name} plan`
      : null,
    planDetails: teamPlanStatus.planDetails,
    currentCount: teamPlanStatus.projectCount,
    isLoading: teamPlanStatus.isLoading,
  };
}

// Hook for checking if team can add more team members
export function useCanAddTeamMember(teamId: string) {
  const teamPlanStatus = useTeamPlanStatusWithSubscription(teamId);

  return {
    canAdd: !teamPlanStatus.hasReachedMemberLimit,
    reason: teamPlanStatus.hasReachedMemberLimit
      ? `Team has reached the limit of ${teamPlanStatus.planDetails.teamMemberLimit} members on the ${teamPlanStatus.planDetails.name} plan`
      : null,
    planDetails: teamPlanStatus.planDetails,
    currentCount: teamPlanStatus.memberCount,
    isLoading: teamPlanStatus.isLoading,
  };
}
