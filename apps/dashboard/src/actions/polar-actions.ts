"use server";

import { authEnv } from "@bklit/auth/env";
import { Polar } from "@polar-sh/sdk";

const env = authEnv();
const polarClient = new Polar({
  accessToken: env.POLAR_ACCESS_TOKEN,
  server: env.POLAR_SERVER_MODE,
});

export async function getPolarSubscriptionsForOrg(_organizationId: string) {
  try {
    // Fetch products from Polar
    const products = await polarClient.products.list({ limit: 100 });

    return {
      success: true,
      data: {
        products,
      },
    };
  } catch (error) {
    console.error("Error fetching Polar data:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch Polar data",
    };
  }
}

// Note: Polar integration is now handled by better-auth
// This file is kept for potential admin functions that might need direct Polar API access
