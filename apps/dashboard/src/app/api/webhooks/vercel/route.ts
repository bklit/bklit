import { prisma } from "@bklit/db/client";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // Only process deployment.succeeded events
    if (payload.type !== "deployment.succeeded") {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const { deployment } = payload;

    // Find matching Bklit project by Vercel project ID
    const projectExtension = await prisma.projectExtension.findFirst({
      where: {
        extensionId: "vercel",
        enabled: true,
        config: {
          path: ["vercelProjectId"],
          equals: deployment.projectId,
        },
      },
    });

    if (!projectExtension) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const config = projectExtension.config as {
      vercelProjectId: string;
      trackEnvironments: string[];
    };

    // Check if environment should be tracked
    if (!config.trackEnvironments.includes(deployment.target)) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    // Create deployment record
    await prisma.deployment.create({
      data: {
        projectId: projectExtension.projectId,
        environment: deployment.target,
        commitSha:
          deployment.meta?.githubCommitSha ||
          deployment.gitSource?.sha ||
          "unknown",
        commitMessage: deployment.gitSource?.message || "No message",
        branch: deployment.gitSource?.ref || "unknown",
        author: deployment.gitSource?.author || "Unknown",
        deployedAt: new Date(deployment.created),
        platform: "vercel",
        deploymentUrl: `https://${deployment.url}`,
        status: "success",
        vercelDeploymentId: deployment.id,
        vercelProjectId: deployment.projectId,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Vercel webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
