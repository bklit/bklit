"use client";

import { initBklit } from "@bklit/sdk";
import { useEffect } from "react";

export function BklitProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Use ngrok URL in development if provided, otherwise use SDK defaults
    const apiHost = process.env.NEXT_PUBLIC_BKLIT_API_HOST
      ? `${process.env.NEXT_PUBLIC_BKLIT_API_HOST}/api/track`
      : undefined;

    const apiKey = process.env.NEXT_PUBLIC_BKLIT_WEBSITE_API_TOKEN;

    if (!apiKey) {
      console.error(
        "❌ BklitProvider: NEXT_PUBLIC_BKLIT_WEBSITE_API_TOKEN is not set",
      );
      return;
    }

    initBklit({
      projectId: "cmic3a5ap0003zxfjshgs688w",
      apiKey,
      apiHost,
      debug: process.env.NODE_ENV === "development",
    });
  }, []);

  return <>{children}</>;
}
