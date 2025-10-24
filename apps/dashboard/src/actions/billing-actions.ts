"use server";

import { revalidatePath } from "next/cache";

export async function revalidateBillingData(organizationId: string) {
  // Revalidate Next.js server cache to ensure fresh data
  revalidatePath(`/${organizationId}/settings/billing`);
  revalidatePath(`/${organizationId}`);
  revalidatePath(`/settings/billing`);
}
