/* eslint-disable react/no-danger */
"use client";

import Script from "next/script";
import { initBklit } from "./index";

// Ensure initBklit is available on window for the inline script
if (typeof window !== "undefined") {
  window.initBklit = initBklit;
}

interface BklitComponentProps {
  projectId: string;
  apiKey?: string;
  apiHost?: string;
  environment?: "development" | "production";
  debug?: boolean;
}

const stringify = (value: unknown): string => {
  if (value === undefined) return "undefined";
  if (typeof value === "string") return JSON.stringify(value);
  return JSON.stringify(value);
};

export function BklitComponent({
  projectId,
  apiKey,
  apiHost,
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
          apiHost: ${stringify(apiHost)},
          environment: ${stringify(environment)},
          debug: ${stringify(debug)},
        });
      }
    })();
  `;

  return (
    <Script
      id="bklit-init"
      strategy="afterInteractive"
      // biome-ignore lint: dangerouslySetInnerHTML is fine here
      dangerouslySetInnerHTML={{
        __html: initCode,
      }}
    />
  );
}
