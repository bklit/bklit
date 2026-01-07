"use client";

import { Button } from "@bklit/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { useTRPC } from "@/trpc/react";
import { ExtensionCardMini } from "./extension-card-mini";
import { ExtensionConfigSheet } from "./extension-config-sheet";

export function ProjectExtensionsList({
  organizationId,
  projectId,
}: {
  organizationId: string;
  projectId: string;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [editingExtensionId, setEditingExtensionId] = useState<string | null>(
    null,
  );

  const { data: extensions, isLoading } = useQuery({
    ...trpc.extension.listForProject.queryOptions({ projectId }),
  });

  const toggleMutation = useMutation(
    trpc.extension.toggle.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [["extension", "listForProject"]],
        });
      },
    }),
  );

  if (isLoading) {
    return <div className="container mx-auto">Loading...</div>;
  }

  if (!extensions || extensions.length === 0) {
    return (
      <Card className="container mx-auto">
        <CardHeader>
          <CardTitle>No Extensions</CardTitle>
          <CardDescription>
            No extensions have been activated for this project yet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href={`/${organizationId}/extensions`}>
              Browse Extensions
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Sort extensions: enabled first, then alphabetically by name
  const sortedExtensions = [...extensions].sort((a, b) => {
    // First by enabled status (enabled first)
    if (a.enabled !== b.enabled) {
      return a.enabled ? -1 : 1;
    }
    // Then alphabetically by display name
    const aName = a.metadata?.displayName || a.extensionId;
    const bName = b.metadata?.displayName || b.extensionId;
    return aName.localeCompare(bName);
  });

  return (
    <>
      <div className="container mx-auto">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedExtensions.map((ext) => (
            <ExtensionCardMini
              key={ext.id}
              extensionId={ext.extensionId}
              displayName={ext.metadata?.displayName || ext.extensionId}
              description={ext.metadata?.description || ""}
              icon={ext.metadata?.icon}
              enabled={ext.enabled}
              onEdit={() => setEditingExtensionId(ext.extensionId)}
              onToggle={(enabled) =>
                toggleMutation.mutate({
                  projectId,
                  extensionId: ext.extensionId,
                  enabled,
                })
              }
            />
          ))}
        </div>
      </div>

      <ExtensionConfigSheet
        extensionId={editingExtensionId}
        projectId={projectId}
        organizationId={organizationId}
        open={!!editingExtensionId}
        onOpenChange={(open) => !open && setEditingExtensionId(null)}
      />
    </>
  );
}
