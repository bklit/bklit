import { CodeBlockClient } from "@bklit/ui/components/code-block-client";

export const SDKs = () => {
  return (
    <div className="p-16">
      <CodeBlockClient language="typescript">{`import { initBklit } from "@bklit/sdk";

initBklit({
  projectId: 'YOUR-PROJECT-ID',
  apiKey: 'YOUR-API-KEY',
});`}</CodeBlockClient>
    </div>
  );
};
