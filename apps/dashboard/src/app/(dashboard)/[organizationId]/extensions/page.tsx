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
        description="Extend Bklit with powerful integrations and automations."
        title="Extensions"
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
                author={extension.author}
                category={extension.category}
                description={extension.description}
                displayName={extension.displayName}
                icon={extension.icon}
                id={extension.id}
                isPro={extension.isPro}
                key={extension.id}
                organizationId={organizationId}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
