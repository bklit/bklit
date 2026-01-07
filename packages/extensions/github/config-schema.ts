import { z } from "zod";

export const githubConfigSchema = z.object({
  repository: z.string().describe("GitHub repository (owner/repo)"),
  repositoryId: z.number().optional().describe("GitHub repository ID"),

  // Workflow-based detection
  productionWorkflows: z
    .array(z.string())
    .optional()
    .describe("Workflow names/IDs that deploy to production"),

  productionBranch: z
    .string()
    .default("main")
    .describe("Branch that deploys to production"),
});

export type GitHubConfig = z.infer<typeof githubConfigSchema>;
