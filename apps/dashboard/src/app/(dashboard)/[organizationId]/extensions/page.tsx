import { ExtensionCard } from "@/components/extensions/extension-card";
import { PageHeader } from "@/components/header/page-header";
import { authenticated } from "@/lib/auth";
import { api } from "@/trpc/server";

export default async function ExtensionsPage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  await authenticated();
  const { organizationId } = await params;

  const extensions = await api.extension.listAvailable();

  return (
    <>
      <PageHeader
        title="Extensions"
        description="Extend Bklit with powerful integrations and automations."
      />
      <div className="container mx-auto">
        {extensions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">
              No extensions available yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {extensions.map((extension) => (
              <ExtensionCard
                key={extension.id}
                id={extension.id}
                displayName={extension.displayName}
                description={extension.description}
                author={extension.author}
                category={extension.category}
                isPro={extension.isPro}
                organizationId={organizationId}
                icon={extension.icon}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
