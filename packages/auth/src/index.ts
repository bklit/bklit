import { expo } from "@better-auth/expo";
import { prisma } from "@bklit/db/client";
import { sendEmail } from "@bklit/email/client";
import { BklitInvitationEmail } from "@bklit/email/emails/invitation";
import { BklitWelcomeEmail } from "@bklit/email/emails/welcome";
import { render } from "@react-email/render";
import {
  checkout,
  polar,
  portal,
  usage,
  webhooks,
} from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
import type { BetterAuthOptions } from "better-auth";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createAuthMiddleware } from "better-auth/api";
import { oAuthProxy, organization } from "better-auth/plugins";
import { authEnv } from "../env";
import plansTemplate from "./pricing-plans.json";
import {
  logWebhookPayload,
  type PolarWebhookPayload,
  updateOrganizationPlan,
} from "./webhook-helpers";

const env = authEnv();

// Inject env vars into plans
const plans = plansTemplate.map((plan) => {
  if (plan.name === "Free") {
    return {
      ...plan,
      // Free plan may not have a Polar product (users are on free by default)
      polarProductId: env.POLAR_FREE_PRODUCT_ID || null,
    };
  }
  if (plan.name === "Pro") {
    return {
      ...plan,
      polarProductId: env.POLAR_PRO_PRODUCT_ID,
    };
  }
  return plan;
});

const polarClient = new Polar({
  accessToken: env.POLAR_ACCESS_TOKEN,
  server: env.POLAR_SERVER_MODE,
});

export function initAuth(options: {
  baseUrl: string;
  productionUrl: string;
  secret: string | undefined;

  githubClientId: string;
  githubClientSecret: string;
  googleClientId: string;
  googleClientSecret: string;
}) {
  const config = {
    database: prismaAdapter(prisma, {
      provider: "postgresql",
    }),
    baseURL: options.baseUrl,
    secret: options.secret,
    hooks: {
      after: createAuthMiddleware(async (ctx) => {
        const newSession = ctx.context.newSession;

        console.log("[AUTH HOOK] New session created:", !!newSession);
        console.log("[AUTH HOOK] User email:", newSession?.user?.email);

        // Check if this is a new user signup (social or email)
        if (newSession?.user.email) {
          // Check if this is a newly created user (within last 10 seconds)
          const user = await prisma.user.findUnique({
            where: { id: newSession.user.id },
          });

          console.log("[AUTH HOOK] User found:", !!user);
          console.log("[AUTH HOOK] User created at:", user?.createdAt);
          console.log("[AUTH HOOK] Current time:", new Date());
          
          if (user) {
            const isNewUser = Date.now() - user.createdAt.getTime() < 10000;
            console.log("[AUTH HOOK] Is new user (< 10s):", isNewUser);
            console.log("[AUTH HOOK] Time since creation (ms):", Date.now() - user.createdAt.getTime());

            if (isNewUser) {
              console.log("[AUTH HOOK] ✅ Processing new user signup...");

              // Send welcome email
              try {
                await sendEmail({
                  to: newSession.user.email,
                  from: "noreply@bklit.com",
                  subject: "Welcome to ❖ Bklit! 🎉",
                  react: BklitWelcomeEmail({
                    username:
                      newSession.user.name ||
                      newSession.user.email.split("@")[0] ||
                      "there",
                  }),
                });
              } catch (emailError) {
                console.error("Failed to send welcome email:", emailError);
              }

              // Auto-invite to default project's organization if configured
              const defaultProject = env.BKLIT_DEFAULT_PROJECT;
              console.log("[AUTO-INVITE] Default project ID:", defaultProject);
              
              if (defaultProject) {
                try {
                  console.log(
                    "[AUTO-INVITE] Looking up project:",
                    defaultProject,
                  );
                  
                  // Find the project and its organization
                  const project = await prisma.project.findUnique({
                    where: { id: defaultProject },
                    include: { organization: true },
                  });

                  console.log(
                    "[AUTO-INVITE] Project found:",
                    project ? "Yes" : "No",
                  );
                  console.log(
                    "[AUTO-INVITE] Organization:",
                    project?.organization?.name,
                  );

                  if (project?.organization) {
                    const organizationId = project.organization.id;

                    // Check if user is already a member or has an invitation
                    const existingMember = await prisma.member.findFirst({
                      where: {
                        organizationId,
                        userId: user.id,
                      },
                    });

                    const existingInvitation =
                      await prisma.invitation.findFirst({
                        where: {
                          organizationId,
                          email: user.email,
                          status: "pending",
                        },
                      });

                    console.log(
                      "[AUTO-INVITE] Existing member:",
                      existingMember ? "Yes" : "No",
                    );
                    console.log(
                      "[AUTO-INVITE] Existing invitation:",
                      existingInvitation ? "Yes" : "No",
                    );

                    if (!existingMember && !existingInvitation) {
                      // Create invitation
                      const invitation = await prisma.invitation.create({
                        data: {
                          id: crypto.randomUUID(),
                          organizationId,
                          email: user.email,
                          role: "member",
                          status: "pending",
                          expiresAt: new Date(
                            Date.now() + 30 * 24 * 60 * 60 * 1000,
                          ), // 30 days
                          inviterId: user.id, // Self-invitation from system
                        },
                      });
                      console.log(
                        "[AUTO-INVITE] ✅ Invitation created:",
                        invitation.id,
                      );

                      // Send invitation email
                      try {
                        const baseUrl =
                          process.env.NEXT_PUBLIC_APP_URL ||
                          "http://localhost:3000";
                        const inviteLink = `${baseUrl}/invite/${invitation.id}`;

                        const emailHtml = await render(
                          BklitInvitationEmail({
                            inviterName: "Bklit Team",
                            organizationName: project.organization.name,
                            inviteLink,
                            role: "member",
                          }),
                        );

                        await sendEmail({
                          to: user.email,
                          from: "noreply@bklit.com",
                          subject: `You've been invited to join ${project.organization.name} on Bklit`,
                          html: emailHtml,
                        });

                        console.log(
                          "[AUTO-INVITE] ✅ Invitation email sent to:",
                          user.email,
                        );
                      } catch (emailError) {
                        console.error(
                          "[AUTO-INVITE] ❌ Failed to send invitation email:",
                          emailError,
                        );
                        // Don't fail the whole process if email fails
                      }
                    } else {
                      console.log(
                        "[AUTO-INVITE] ⏭️  Skipped - user already has access",
                      );
                    }
                  } else {
                    console.log(
                      "[AUTO-INVITE] ❌ Project not found or has no organization",
                    );
                  }
                } catch (inviteError) {
                  console.error(
                    "[AUTO-INVITE] ❌ Failed to auto-invite to default project:",
                    inviteError,
                  );
                }
              } else {
                console.log(
                  "[AUTO-INVITE] ⏭️  No default project configured",
                );
              }
            } else {
              console.log("[AUTH HOOK] ⏭️ Skipping - not a new user (account created >10s ago)");
            }
          } else {
            console.log("[AUTH HOOK] ❌ User not found in database");
          }
        } else {
          console.log("[AUTH HOOK] ⏭️ No email in session");
        }
      }),
    },
    plugins: [
      oAuthProxy({
        /**
         * Auto-inference blocked by https://github.com/better-auth/better-auth/pull/2891
         */
        currentURL: options.baseUrl,
        productionURL: options.productionUrl,
      }),
      organization(),
      polar({
        client: polarClient,
        createCustomerOnSignUp: true,
        use: [
          checkout({
            // Only include plans that have a Polar product ID
            products: plans
              .filter((plan) => plan.polarProductId)
              .map((plan) => ({
                productId: plan.polarProductId as string,
                slug: plan.slug,
              })),
            successUrl: "/settings/billing?purchase=success", // Generic success URL, will redirect to correct organization
            authenticatedUsersOnly: true,
          }),
          portal(),
          usage(),
          webhooks({
            secret: env.POLAR_WEBHOOK_SECRET,
            onSubscriptionActive: async (payload: PolarWebhookPayload) => {
              logWebhookPayload("subscription.active", payload);
              const referenceId = payload.data?.reference_id;
              if (referenceId) {
                await updateOrganizationPlan(referenceId, "pro");
              }
            },
            onSubscriptionCanceled: async (payload: PolarWebhookPayload) => {
              logWebhookPayload("subscription.canceled", payload);
              const referenceId = payload.data?.reference_id;
              if (referenceId) {
                await updateOrganizationPlan(referenceId, "free");
              }
            },
            onSubscriptionRevoked: async (payload: PolarWebhookPayload) => {
              logWebhookPayload("subscription.revoked", payload);
              const referenceId = payload.data?.reference_id;
              if (referenceId) {
                await updateOrganizationPlan(referenceId, "free");
              }
            },
            onCustomerStateChanged: async (payload) => {
              logWebhookPayload("customer.state_changed", payload);
            },
            onOrderPaid: async (payload) => {
              logWebhookPayload("order.paid", payload);
            },
            onPayload: async (payload) => {
              logWebhookPayload("webhook.received", payload);
            },
          }),
        ],
      }),
      expo(),
    ],
    socialProviders: {
      github: {
        clientId: options.githubClientId,
        clientSecret: options.githubClientSecret,
        redirectURI: `${options.baseUrl}/api/auth/callback/github`,
      },
      ...(options.googleClientId && options.googleClientSecret
        ? {
            google: {
              clientId: options.googleClientId,
              clientSecret: options.googleClientSecret,
              redirectURI: `${options.baseUrl}/api/auth/callback/google`,
            },
          }
        : {}),
    },
    trustedOrigins: ["expo://"],
  } satisfies BetterAuthOptions;

  return betterAuth(config);
}

export type BetterAuth = typeof betterAuth;
export type Auth = ReturnType<typeof initAuth>;
export type Session = Auth["$Infer"]["Session"];

// Export Polar configuration
export const polarConfig = {
  organizationId: env.POLAR_ORGANIZATION_ID,
  freeProductId: env.POLAR_FREE_PRODUCT_ID || null,
  proProductId: env.POLAR_PRO_PRODUCT_ID,
  serverMode: env.POLAR_SERVER_MODE,
} as const;

// Export plans with injected IDs
export { plans };
