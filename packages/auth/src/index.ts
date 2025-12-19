import { expo } from "@better-auth/expo";
import { prisma } from "@bklit/db/client";
import { sendEmail } from "@bklit/email/client";
import { BklitInvitationEmail } from "@bklit/email/emails/invitation";
import { BklitWelcomeEmail } from "@bklit/email/emails/welcome";
import {
  checkout,
  polar,
  portal,
  usage,
  webhooks,
} from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
import { render } from "@react-email/render";
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

        // Check if this is a new user signup (social or email)
        if (newSession?.user.email) {
          // Check if this is a newly created user by comparing session and user creation times
          const user = await prisma.user.findUnique({
            where: { id: newSession.user.id },
          });

          if (user && newSession.session?.createdAt) {
            // If session was created within 5 seconds of user creation, treat as new signup
            const timeDiff = Math.abs(
              new Date(newSession.session.createdAt).getTime() -
                user.createdAt.getTime(),
            );
            const isNewUser = timeDiff < 5000;

            if (isNewUser) {
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

              if (defaultProject) {
                try {
                  // Find the project and its organization
                  const project = await prisma.project.findUnique({
                    where: { id: defaultProject },
                    include: { organization: true },
                  });

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
                      } catch (emailError) {
                        console.error(
                          "Failed to send auto-invite email:",
                          emailError,
                        );
                        // Don't fail the whole process if email fails
                      }
                    }
                  }
                } catch (inviteError) {
                  console.error("Failed to auto-invite:", inviteError);
                }
              }
            }
          }
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

// Export Polar client for direct API access
export { polarClient };

// Export Polar configuration
export const polarConfig = {
  organizationId: env.POLAR_ORGANIZATION_ID,
  freeProductId: env.POLAR_FREE_PRODUCT_ID || null,
  proProductId: env.POLAR_PRO_PRODUCT_ID,
  serverMode: env.POLAR_SERVER_MODE,
} as const;

// Export plans with injected IDs
export { plans };

// Export env function for other packages
export { authEnv };
