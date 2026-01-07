import crypto from "node:crypto";
import { prisma } from "@bklit/db/client";
import { NextResponse } from "next/server";
import { env } from "@/env";

export async function POST(req: Request) {
  try {
    const event = req.headers.get("x-github-event");
    console.log(`[GITHUB WEBHOOK] Received ${event} event`);

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
      console.log("[GITHUB WEBHOOK] ❌ Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Handle ping event (sent when webhook is created)
    if (event === "ping") {
      console.log("[GITHUB WEBHOOK] ✅ Ping received");
      return NextResponse.json({ ok: true, message: "Webhook configured successfully!" });
    }

    // Process workflow_run and deployment_status events
    if (event !== "workflow_run" && event !== "deployment_status") {
      console.log(`[GITHUB WEBHOOK] Skipping event type: ${event}`);
      return NextResponse.json({ ok: true, skipped: true });
    }

    // For workflow_run events
    if (event === "workflow_run") {
      const { workflow_run } = payload;

      console.log("[GITHUB WEBHOOK] Received workflow_run event:", {
        name: workflow_run.name,
        status: workflow_run.status,
        conclusion: workflow_run.conclusion,
        branch: workflow_run.head_branch,
        repository: repository?.full_name,
      });

      // Only process completed workflows
      if (
        workflow_run.status !== "completed" ||
        workflow_run.conclusion !== "success"
      ) {
        console.log("[GITHUB WEBHOOK] Skipping - not completed/success");
        return NextResponse.json({ ok: true, skipped: true });
      }

      // Continue with workflow processing...
      return await processWorkflowDeployment(workflow_run, repository, prisma);
    }

    // For deployment_status events (Vercel, Netlify, etc.)
    if (event === "deployment_status") {
      const { deployment_status, deployment } = payload;

      console.log("[GITHUB WEBHOOK] Received deployment_status event:", {
        state: deployment_status.state,
        environment: deployment_status.environment,
        ref: deployment.ref,
        sha: deployment.sha,
        repository: repository?.full_name,
      });

      // Only process successful deployments
      if (deployment_status.state !== "success") {
        console.log(
          `[GITHUB WEBHOOK] Skipping - deployment status not success: ${deployment_status.state}`,
        );
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
    console.log("[GITHUB WEBHOOK] Processing workflow deployment...");
    
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
      console.log(
        `[GITHUB WEBHOOK] No project extension found for repository: ${repository.full_name}`,
      );
      return NextResponse.json({ ok: true, skipped: true });
    }

    console.log("[GITHUB WEBHOOK] Found project extension:", {
      projectId: projectExtension.projectId,
      projectName: projectExtension.project.name,
    });

    const config = projectExtension.config as {
      repository: string;
      productionWorkflows?: string[];
      productionBranch: string;
    };

    console.log("[GITHUB WEBHOOK] Extension config:", {
      productionWorkflows: config.productionWorkflows,
      productionBranch: config.productionBranch,
      workflowName: workflow_run.name,
      workflowId: workflow_run.workflow_id,
      branch: workflow_run.head_branch,
    });

    // Check if this workflow is in the production workflows list
    const isProductionWorkflow = config.productionWorkflows?.some(
      (wf) =>
        wf === workflow_run.name || wf === String(workflow_run.workflow_id),
    );

    if (!isProductionWorkflow) {
      console.log(
        `[GITHUB WEBHOOK] Skipping - workflow not in production list: ${workflow_run.name}`,
      );
      return NextResponse.json({ ok: true, skipped: true });
    }

    // Check if it's the production branch
    if (workflow_run.head_branch !== config.productionBranch) {
      console.log(
        `[GITHUB WEBHOOK] Skipping - branch mismatch: ${workflow_run.head_branch} !== ${config.productionBranch}`,
      );
      return NextResponse.json({ ok: true, skipped: true });
    }

    console.log("[GITHUB WEBHOOK] Creating deployment record...");

    // Create deployment record
    const deployment = await prisma.deployment.create({
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

    console.log("[GITHUB WEBHOOK] ✅ Deployment created successfully!", {
      deploymentId: deployment.id,
      commitSha: deployment.commitSha.slice(0, 7),
      projectId: deployment.projectId,
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
    console.log("[GITHUB WEBHOOK] Processing deployment status...");

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
      console.log(
        `[GITHUB WEBHOOK] No project extension found for repository: ${repository.full_name}`,
      );
      return NextResponse.json({ ok: true, skipped: true });
    }

    console.log("[GITHUB WEBHOOK] Found project extension:", {
      projectId: projectExtension.projectId,
      projectName: projectExtension.project.name,
    });

    const config = projectExtension.config as {
      repository: string;
      productionBranch: string;
    };

    console.log("[GITHUB WEBHOOK] Checking deployment environment:", {
      deploymentRef: deployment.ref,
      environment: deployment.environment,
      productionEnvironment: deployment.production_environment,
      transientEnvironment: deployment.transient_environment,
    });

    // For Vercel deployments, check environment instead of ref (Vercel uses commit SHA as ref)
    // Accept if:
    // 1. production_environment flag is true
    // 2. OR environment name contains "production" (case-insensitive)
    // 3. AND it's not a transient environment
    const isProductionDeployment =
      deployment.production_environment === true ||
      (deployment.environment?.toLowerCase().includes("production") &&
        deployment.transient_environment !== true);

    if (!isProductionDeployment) {
      console.log(
        `[GITHUB WEBHOOK] Skipping - not a production deployment (environment: ${deployment.environment}, production_environment: ${deployment.production_environment})`,
      );
      return NextResponse.json({ ok: true, skipped: true });
    }

    console.log("[GITHUB WEBHOOK] ✅ Production deployment detected!");

    console.log("[GITHUB WEBHOOK] Creating deployment record from deployment_status...");

    // Create deployment record
    const deploymentRecord = await prisma.deployment.create({
      data: {
        projectId: projectExtension.projectId,
        environment: deployment.environment || "production",
        commitSha: deployment.sha,
        commitMessage: deployment.description || "Deployment",
        branch: deployment.ref.replace("refs/heads/", ""),
        author: deployment.creator?.login || "Unknown",
        authorAvatar: deployment.creator?.avatar_url,
        deployedAt: new Date(deployment_status.created_at),
        platform: "vercel", // Vercel deployment via GitHub
        deploymentUrl:
          deployment_status.target_url || deployment_status.environment_url,
        status: "success",
        githubRepository: repository.full_name,
      },
    });

    console.log("[GITHUB WEBHOOK] ✅ Deployment created successfully!", {
      deploymentId: deploymentRecord.id,
      commitSha: deploymentRecord.commitSha.slice(0, 7),
      projectId: deploymentRecord.projectId,
      environment: deploymentRecord.environment,
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
