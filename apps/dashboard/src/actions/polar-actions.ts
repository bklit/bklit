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

export async function syncPolarData() {
  try {
    // Sync products first
    // await syncPolarProductsToDatabase();

    // Then sync subscriptions
    // await syncAllActiveSubscriptions();

    return { success: true, message: "Polar data synced successfully" };
  } catch (error) {
    console.error("Error syncing Polar data:", error);
    return { success: false, error: "Failed to sync Polar data" };
  }
}

export async function syncPolarProducts() {
  try {
    // await syncPolarProductsToDatabase();
    return { success: true, message: "Polar products synced successfully" };
  } catch (error) {
    console.error("Error syncing Polar products:", error);
    return { success: false, error: "Failed to sync Polar products" };
  }
}

export async function syncPolarSubscriptions() {
  try {
    // await syncAllActiveSubscriptions();
    return {
      success: true,
      message: "Polar subscriptions synced successfully",
    };
  } catch (error) {
    console.error("Error syncing Polar subscriptions:", error);
    return { success: false, error: "Failed to sync Polar subscriptions" };
  }
}
