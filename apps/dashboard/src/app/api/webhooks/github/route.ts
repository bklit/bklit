import crypto from "node:crypto";
import { prisma } from "@bklit/db/client";
import { NextResponse } from "next/server";
import { env } from "@/env";

export async function POST(req: Request) {
  try {
    const signature = req.headers.get("x-hub-signature-256");
    const rawBody = await req.text();

    if (!verifySignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const event = req.headers.get("x-github-event");

    // Only process workflow_run events
    if (event !== "workflow_run") {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const { workflow_run, repository } = payload;

    // Only process completed workflows
    if (
      workflow_run.status !== "completed" ||
      workflow_run.conclusion !== "success"
    ) {
      return NextResponse.json({ ok: true, skipped: true });
    }

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
    console.error("GitHub webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

function verifySignature(body: string, signature: string | null): boolean {
  if (!signature) return false;
  const secret = env.GITHUB_WEBHOOK_SECRET;
  if (!secret) return true; // Skip in development

  const hash =
    "sha256=" + crypto.createHmac("sha256", secret).update(body).digest("hex");

  return signature === hash;
}
