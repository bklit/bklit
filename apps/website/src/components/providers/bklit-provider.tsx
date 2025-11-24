"use client";

import { BklitComponent } from "@bklit/sdk/nextjs";

export function BklitProvider({ children }: { children: React.ReactNode }) {
  const apiHost = process.env.NEXT_PUBLIC_BKLIT_API_HOST
    ? `${process.env.NEXT_PUBLIC_BKLIT_API_HOST}/api/track`
    : undefined;

  const apiKey = process.env.NEXT_PUBLIC_BKLIT_WEBSITE_API_TOKEN;

  return (
    <>
      <BklitComponent
        projectId="cmic3a5ap0003zxfjshgs688w"
        apiKey={apiKey}
        apiHost={apiHost}
        debug={process.env.NODE_ENV === "development"}
      />
      {children}
    </>
  );
}
