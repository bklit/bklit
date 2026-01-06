import { prisma } from "@bklit/db/client";
import { GitHubClient } from "@bklit/extensions/github/api-client";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const githubRouter = createTRPCRouter({
  getInstallation: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ input }) => {
      return await prisma.gitHubInstallation.findFirst({
        where: { organizationId: input.organizationId },
      });
    }),

  saveInstallation: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Get session from context (already authenticated via protectedProcedure)
      const session = ctx.session;

      console.log("[GITHUB SAVE] Session user:", session.user.id);
      console.log("[GITHUB SAVE] Accounts in session:", session.user.accounts);
      console.log(
        "[GITHUB SAVE] Accounts length:",
        session.user.accounts?.length,
      );

      if (!session) {
        throw new Error("Not authenticated");
      }

      // Find GitHub account
      const githubAccount = session.user.accounts?.find(
        (acc) => acc.providerId === "github",
      );

      console.log("[GITHUB SAVE] GitHub account found:", !!githubAccount);

      if (!githubAccount || !githubAccount.accessToken) {
        // Try fetching from Account table directly
        console.log(
          "[GITHUB SAVE] Checking Account table for user:",
          session.user.id,
        );

        // Wait a moment for Better Auth to create the account (it might be processing)
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const accountFromDb = await prisma.account.findFirst({
          where: {
            userId: session.user.id,
            providerId: "github",
          },
        });

        console.log(
          "[GITHUB SAVE] Account from DB:",
          !!accountFromDb,
          "Has token:",
          !!accountFromDb?.accessToken,
        );

        if (!accountFromDb || !accountFromDb.accessToken) {
          throw new Error(
            "GitHub account linking in progress - please refresh the page in a moment",
          );
        }

        // Use account from DB
        const installation = await prisma.gitHubInstallation.upsert({
          where: {
            organizationId_githubUserId: {
              organizationId: input.organizationId,
              githubUserId: accountFromDb.accountId,
            },
          },
          create: {
            organizationId: input.organizationId,
            githubUserId: accountFromDb.accountId,
            githubUsername: accountFromDb.accountId,
            accessToken: accountFromDb.accessToken,
            refreshToken: accountFromDb.refreshToken || null,
            repositories: [],
          },
          update: {
            accessToken: accountFromDb.accessToken,
            refreshToken: accountFromDb.refreshToken || null,
          },
        });

        return { success: true };
      }

      // Save installation
      await prisma.gitHubInstallation.upsert({
        where: {
          organizationId_githubUserId: {
            organizationId: input.organizationId,
            githubUserId: githubAccount.accountId,
          },
        },
        create: {
          organizationId: input.organizationId,
          githubUserId: githubAccount.accountId,
          githubUsername: githubAccount.accountId,
          accessToken: githubAccount.accessToken,
          refreshToken: githubAccount.refreshToken || null,
          repositories: [],
        },
        update: {
          accessToken: githubAccount.accessToken,
          refreshToken: githubAccount.refreshToken || null,
        },
      });

      return { success: true };
    }),

  listRepositories: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ input }) => {
      const installation = await prisma.gitHubInstallation.findFirst({
        where: { organizationId: input.organizationId },
      });

      if (!installation) throw new Error("GitHub not connected");

      const client = new GitHubClient(installation.accessToken);
      return await client.listRepositories();
    }),

  listWorkflows: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        repository: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const installation = await prisma.gitHubInstallation.findFirst({
        where: { organizationId: input.organizationId },
      });

      if (!installation) throw new Error("GitHub not connected");

      const [owner, repo] = input.repository.split("/");
      const client = new GitHubClient(installation.accessToken);
      const workflows = await client.listWorkflows(owner, repo);

      // Fetch recent runs for each workflow
      const workflowsWithRuns = await Promise.all(
        workflows.map(async (workflow) => {
          const runs = await client.getRecentWorkflowRuns(
            owner,
            repo,
            workflow.id,
          );
          return { ...workflow, recentRuns: runs };
        }),
      );

      return workflowsWithRuns;
    }),

  setupWebhook: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        repository: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const installation = await prisma.gitHubInstallation.findFirst({
        where: { organizationId: input.organizationId },
      });

      if (!installation) throw new Error("GitHub not connected");

      const [owner, repo] = input.repository.split("/");
      const client = new GitHubClient(installation.accessToken);

      await client.createWebhook(
        owner,
        repo,
        `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/github`,
        process.env.GITHUB_WEBHOOK_SECRET || "",
      );

      return { success: true };
    }),
});
