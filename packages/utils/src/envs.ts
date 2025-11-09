export function dashboardUrl() {
  // Use environment variables (AUTH_URL or NEXT_PUBLIC_APP_URL)
  const envUrl = process.env.AUTH_URL || process.env.NEXT_PUBLIC_APP_URL;

  if (envUrl) {
    return envUrl;
  }

  // Fallback to Vercel preview URL
  if (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Final fallback for local development
  return "http://localhost:3000";
}
