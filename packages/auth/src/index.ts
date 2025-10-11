import { expo } from "@better-auth/expo";
import { prisma } from "@bklit/db/client";
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
import { oAuthProxy, organization } from "better-auth/plugins";
import { authEnv } from "../env";
import plansTemplate from "./pricing-plans.json";

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
}) {
  const config = {
    database: prismaAdapter(prisma, {
      provider: "postgresql",
    }),
    baseURL: options.baseUrl,
    secret: options.secret,
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
            successUrl: "/",
            authenticatedUsersOnly: true,
          }),
          portal(),
          usage(),
          webhooks({
            secret: env.POLAR_WEBHOOK_SECRET,
            onCustomerStateChanged: async (_payload) => {},
            onOrderPaid: async (_payload) => {},
            onPayload: async (_payload) => {},
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
    },
    trustedOrigins: ["expo://"],
  } satisfies BetterAuthOptions;

  return betterAuth(config);
}

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
