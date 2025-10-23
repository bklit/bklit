"use server";

import { auth } from "@/auth/server";
import { authenticated } from "@/lib/auth";

export async function getUserTeams() {
  const session = await authenticated();

  if (!session || !session.user || !session.user.id) {
    return null;
  }

  try {
    return auth.api.listOrganizations();
  } catch (error) {
    console.error("Error fetching user organizations:", error);
    return null;
  }
}
