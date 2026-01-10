import { extensionRegistry } from "@bklit/extensions";
import type { Metadata } from "next";
import { Suspense } from "react";
import { ExtensionsDirectory } from "@/components/extensions-directory";
import { SectionHeader } from "@/components/section-header";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Extensions - Bklit",
  description:
    "Extend Bklit with powerful integrations and automations. Connect with Discord, Slack, GitHub, and more.",
};

export default function ExtensionsPage() {
  const extensions = extensionRegistry.getAllMetadata();

  return (
    <main className="flex min-h-screen w-full flex-col">
      <div className="container mx-auto flex max-w-6xl flex-col space-y-24 px-4 py-48">
        <SectionHeader
          description="Extend Bklit with powerful integrations and automations."
          title="Extensions"
        />
        <Suspense fallback={<div>Loading...</div>}>
          <ExtensionsDirectory extensions={extensions} />
        </Suspense>
      </div>
    </main>
  );
}
