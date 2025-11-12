// User and team related type definitions

// Team membership with team data
export interface TeamMembershipWithTeam {
  team: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    plan: string;
    sites: Array<{
      id: string;
      name: string;
      domain: string | null;
    }>;
  };
  role: string;
}

// User team data for display
export interface UserOrganizationData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  plan: string;
  role: string;
  siteCount: number;
  theme: string | null;
  sites: Array<{
    id: string;
    name: string;
    domain: string | null;
  }>;
}

// Form state for team actions
export interface TeamFormState {
  success: boolean;
  message: string;
  errors?: Record<string, string[] | undefined>;
  newTeamId?: string;
}

// Form state for project actions
export interface ProjectFormState {
  success: boolean;
  message: string;
  errors?: Record<string, string[] | undefined>;
  newprojectId?: string;
}

// User data for display
export interface User {
  name: string;
  email: string;
  avatar: string;
  id?: string;
}
