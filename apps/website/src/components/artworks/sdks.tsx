"use client";

import { CodeBlockClient } from "@bklit/ui/components/code-block-client";

export const SDKs = () => {
  return (
    <CodeBlockClient language="typescript">{`import { initBklit } from "@bklit/sdk";

initBklit({
  projectId: 'YOUR-PROJECT-ID',
  apiKey: 'YOUR-API-KEY',
});`}</CodeBlockClient>
  );
};
