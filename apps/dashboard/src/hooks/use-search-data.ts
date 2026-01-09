"use client";

import { useMemo } from "react";
import { useWorkspace } from "@/contexts/workspace-provider";

interface SearchItem {
  value: string;
  label: string;
  href: string;
}

interface SearchGroup {
  heading: string;
  items: SearchItem[];
}

export function useSearchData() {
  const { organizations, activeOrganization } = useWorkspace();

  // Transform data for search component
  const searchData = useMemo((): {
    currentOrganization: SearchGroup[];
    allOrganizations: SearchGroup[];
  } => {
    if (!organizations) {
      return { currentOrganization: [], allOrganizations: [] };
    }

    const currentOrgData: SearchGroup[] = activeOrganization
      ? [
          {
            heading: activeOrganization.name,
            items: [
              {
                value: `${activeOrganization.id}-overview`,
                label: "Overview",
                href: `/${activeOrganization.id}`,
              },
              {
                value: `${activeOrganization.id}-settings`,
                label: "Settings",
                href: `/${activeOrganization.id}/settings`,
              },
              {
                value: `${activeOrganization.id}-billing`,
                label: "Billing",
                href: `/${activeOrganization.id}/settings/billing`,
              },
            ],
          },
          {
            heading: `${activeOrganization.name} projects`,
            items: activeOrganization.projects.map((project) => ({
              value: `${activeOrganization.id}-${project.name}`,
              label: project.name,
              href: `/${activeOrganization.id}/${project.id}`,
            })),
          },
        ]
      : [];

    const allOrgsData: SearchGroup[] = [
      {
        heading: "Your organizations",
        items: organizations
          .filter((org) => org.id !== activeOrganization?.id)
          .map((org) => ({
            value: `org-${org.name}`,
            label: org.name,
            href: `/${org.id}`,
          })),
      },
    ];

    return {
      currentOrganization: currentOrgData,
      allOrganizations: allOrgsData,
    };
  }, [organizations, activeOrganization]);

  return {
    ...searchData,
    isLoading: false, // No loading state needed since data comes from context
  };
}
