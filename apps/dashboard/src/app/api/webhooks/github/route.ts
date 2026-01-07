import crypto from "node:crypto";
import { prisma } from "@bklit/db/client";
import { NextResponse } from "next/server";
import { env } from "@/env";

export async function POST(req: Request) {
  try {
    const signature = req.headers.get("x-hub-signature-256");
    const rawBody = await req.text();
    const payload = JSON.parse(rawBody);
    const { repository } = payload;

    // Verify signature using repository-specific secret
    const isValid = await verifySignature(
      rawBody,
      signature,
      repository?.full_name,
    );

    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = req.headers.get("x-github-event");

    // Handle ping event (sent when webhook is created)
    if (event === "ping") {
      return NextResponse.json({ ok: true, message: "Webhook configured successfully!" });
    }

    // Process workflow_run and deployment_status events
    if (event !== "workflow_run" && event !== "deployment_status") {
      return NextResponse.json({ ok: true, skipped: true });
    }

    // For workflow_run events
    if (event === "workflow_run") {
      const { workflow_run } = payload;

      // Only process completed workflows
      if (
        workflow_run.status !== "completed" ||
        workflow_run.conclusion !== "success"
      ) {
        return NextResponse.json({ ok: true, skipped: true });
      }

      // Continue with workflow processing...
      return await processWorkflowDeployment(workflow_run, repository, prisma);
    }

    // For deployment_status events (Vercel, Netlify, etc.)
    if (event === "deployment_status") {
      const { deployment_status, deployment } = payload;

      // Only process successful deployments
      if (deployment_status.state !== "success") {
        return NextResponse.json({ ok: true, skipped: true });
      }

      return await processDeploymentStatus(
        deployment,
        deployment_status,
        repository,
        prisma,
      );
    }

    return NextResponse.json({ ok: true, skipped: true });
  } catch (error) {
    console.error("GitHub webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

async function processWorkflowDeployment(
  workflow_run: any,
  repository: any,
  prisma: any,
) {
  try {
    // Find matching project extension
    const projectExtension = await prisma.projectExtension.findFirst({
      where: {
        extensionId: "github",
        enabled: true,
        config: {
          path: ["repository"],
          equals: repository.full_name,
        },
      },
      include: { project: true },
    });

    if (!projectExtension) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const config = projectExtension.config as {
      repository: string;
      productionWorkflows?: string[];
      productionBranch: string;
    };

    // Check if this workflow is in the production workflows list
    const isProductionWorkflow = config.productionWorkflows?.some(
      (wf) =>
        wf === workflow_run.name || wf === String(workflow_run.workflow_id),
    );

    if (!isProductionWorkflow) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    // Check if it's the production branch
    if (workflow_run.head_branch !== config.productionBranch) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    // Create deployment record
    await prisma.deployment.create({
      data: {
        projectId: projectExtension.projectId,
        environment: "production",
        commitSha: workflow_run.head_sha,
        commitMessage: workflow_run.head_commit.message,
        branch: workflow_run.head_branch,
        author: workflow_run.head_commit.author.name,
        authorAvatar: workflow_run.actor.avatar_url,
        deployedAt: new Date(workflow_run.updated_at),
        platform: "github",
        deploymentUrl: workflow_run.html_url,
        status: "success",
        githubWorkflowRunId: String(workflow_run.id),
        githubRepository: repository.full_name,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Workflow deployment error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

async function processDeploymentStatus(
  deployment: any,
  deployment_status: any,
  repository: any,
  prisma: any,
) {
  try {
    // Find matching project extension
    const projectExtension = await prisma.projectExtension.findFirst({
      where: {
        extensionId: "github",
        enabled: true,
        config: {
          path: ["repository"],
          equals: repository.full_name,
        },
      },
      include: { project: true },
    });

    if (!projectExtension) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const config = projectExtension.config as {
      repository: string;
      productionBranch: string;
    };

    // Check if it's the production branch
    if (deployment.ref !== `refs/heads/${config.productionBranch}`) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    // Create deployment record
    await prisma.deployment.create({
      data: {
        projectId: projectExtension.projectId,
        environment: deployment.environment || "production",
        commitSha: deployment.sha,
        commitMessage: deployment.description || "Deployment",
        branch: deployment.ref.replace("refs/heads/", ""),
        author: deployment.creator?.login || "Unknown",
        authorAvatar: deployment.creator?.avatar_url,
        deployedAt: new Date(deployment_status.created_at),
        platform: "github-deployment", // Could be Vercel, Netlify, etc.
        deploymentUrl:
          deployment_status.target_url || deployment_status.environment_url,
        status: "success",
        githubRepository: repository.full_name,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Deployment status error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

async function verifySignature(
  body: string,
  signature: string | null,
  repositoryFullName: string | undefined,
): Promise<boolean> {
  if (!signature) return false;
  if (!repositoryFullName) return false;

  // Look up the webhook secret for this repository from the database
  const projectExtension = await prisma.projectExtension.findFirst({
    where: {
      extensionId: "github",
      enabled: true,
      config: {
        path: ["repository"],
        equals: repositoryFullName,
      },
    },
  });

  if (!projectExtension) {
    console.warn(
      `[WEBHOOK] No project extension found for repository: ${repositoryFullName}`,
    );
    return false;
  }

  const config = projectExtension.config as { webhookSecret?: string };
  const secret = config.webhookSecret;

  if (!secret) {
    console.warn(
      `[WEBHOOK] No webhook secret found for repository: ${repositoryFullName}`,
    );
    // If no secret is stored (legacy webhooks), skip verification in development only
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[WEBHOOK] Skipping signature verification in development (no secret configured)",
      );
      return true;
    }
    return false;
  }

  const hash =
    "sha256=" + crypto.createHmac("sha256", secret).update(body).digest("hex");

  return signature === hash;
}
