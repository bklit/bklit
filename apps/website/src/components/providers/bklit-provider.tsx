"use client";

import { BklitComponent } from "@bklit/sdk/nextjs";

export function BklitProvider({ children }: { children: React.ReactNode }) {
  const isDevelopment = process.env.NODE_ENV === "development";

  const wsHost = isDevelopment ? "ws://localhost:8080" : "wss://bklit.ws:8080";

  const apiKey = process.env.NEXT_PUBLIC_BKLIT_WEBSITE_API_TOKEN;

  if (isDevelopment && typeof window !== "undefined") {
    console.log("🔧 BklitProvider: Using WebSocket", { wsHost, isDevelopment });
  }

  return (
    <>
      <BklitComponent
        apiKey={apiKey}
        debug={isDevelopment}
        environment={isDevelopment ? "development" : "production"}
        projectId="cmic3a5ap0003zxfjshgs688w"
        wsHost={wsHost}
      />
      {children}
    </>
  );
}
