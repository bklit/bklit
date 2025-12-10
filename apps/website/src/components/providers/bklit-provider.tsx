"use client";

import { BklitComponent } from "@bklit/sdk/nextjs";

export function BklitProvider({ children }: { children: React.ReactNode }) {
  // Always use localhost:3000 in development (dashboard app)
  // This overrides any NEXT_PUBLIC_BKLIT_API_HOST env var for local development
  // In production, use NEXT_PUBLIC_BKLIT_API_HOST if set, otherwise let SDK use defaults
  const isDevelopment = process.env.NODE_ENV === "development";
  
  // Force localhost in development, ignore env vars
  const apiHost = isDevelopment
    ? "http://localhost:3000/api/track"
    : process.env.NEXT_PUBLIC_BKLIT_API_HOST
      ? `${process.env.NEXT_PUBLIC_BKLIT_API_HOST}/api/track`
      : undefined;

  const apiKey = process.env.NEXT_PUBLIC_BKLIT_WEBSITE_API_TOKEN;

  // Log in development to help debug
  if (isDevelopment && typeof window !== "undefined") {
    console.log("🔧 BklitProvider: Using API host", { apiHost, isDevelopment });
  }

  return (
    <>
      <BklitComponent
        projectId="cmic3a5ap0003zxfjshgs688w"
        apiKey={apiKey}
        apiHost={apiHost}
        environment={isDevelopment ? "development" : "production"}
        debug={isDevelopment}
      />
      {children}
    </>
  );
}
