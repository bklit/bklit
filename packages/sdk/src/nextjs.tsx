/* eslint-disable react/no-danger */
"use client";

import Script from "next/script";
import { initBklit } from "./index";

if (typeof window !== "undefined") {
  window.initBklit = initBklit;
}

interface BklitComponentProps {
  projectId: string;
  apiKey?: string;
  wsHost?: string;
  environment?: "development" | "production";
  debug?: boolean;
}

const stringify = (value: unknown): string => {
  if (value === undefined) {
    return "undefined";
  }
  if (typeof value === "string") {
    return JSON.stringify(value);
  }
  return JSON.stringify(value);
};

export function BklitComponent({
  projectId,
  apiKey,
  wsHost,
  environment,
  debug,
}: BklitComponentProps) {
  if (!projectId) {
    return null;
  }

  const initCode = `
    (function() {
      if (typeof window !== 'undefined' && window.initBklit) {
        window.initBklit({
          projectId: ${stringify(projectId)},
          apiKey: ${stringify(apiKey)},
          wsHost: ${stringify(wsHost)},
          environment: ${stringify(environment)},
          debug: ${stringify(debug)},
        });
      }
    })();
  `;

  return (
    <Script
      dangerouslySetInnerHTML={{
        __html: initCode,
      }}
      id="bklit-init"
      strategy="afterInteractive"
    />
  );
}
