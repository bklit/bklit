import { polarConfig as basePolarConfig, initAuth } from "@bklit/auth";
import { dashboardUrl } from "@bklit/utils/envs";
import { headers } from "next/headers";
import { cache } from "react";
import { env } from "../env";

export const auth = initAuth({
  baseUrl: dashboardUrl(), // Current environment URL
  productionUrl: process.env.AUTH_URL || "https://app.bklit.com", // Always production
  secret: env.AUTH_SECRET,
  githubClientId: env.AUTH_GITHUB_ID,
  githubClientSecret: env.AUTH_GITHUB_SECRET,
  googleClientId: env.AUTH_GOOGLE_ID || "",
  googleClientSecret: env.AUTH_GOOGLE_SECRET || "",
});

export const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);

// Re-export polarConfig for convenience
export const polarConfig = basePolarConfig;
