"use client";

import { Button } from "@bklit/ui/components/button";
import { Input } from "@bklit/ui/components/input";
import { Label } from "@bklit/ui/components/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@bklit/ui/components/sheet";
import { Switch } from "@bklit/ui/components/switch";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TestTube2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/react";
import { DeleteExtensionDialog } from "./delete-extension-dialog";
import { EventSelector } from "./event-selector";
import { GitHubConfig } from "./github-config";

interface ExtensionConfigSheetProps {
  extensionId: string | null;
  projectId: string;
  organizationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExtensionConfigSheet({
  extensionId,
  projectId,
  organizationId,
  open,
  onOpenChange,
}: ExtensionConfigSheetProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: extensions } = useQuery({
    ...trpc.extension.listForProject.queryOptions({ projectId }),
  });

  const { data: eventDefinitions } = useQuery({
    ...trpc.event.list.queryOptions({ projectId, organizationId }),
  });

  const extension = extensions?.find((e) => e.extensionId === extensionId);
  const config = (extension?.config as Record<string, unknown>) || {};
  const eventIds = extension?.eventDefinitions?.map((e) => e.id) || [];

  const [webhookUrl, setWebhookUrl] = useState(
    (config.webhookUrl as string) || "",
  );
  const [selectedEvents, setSelectedEvents] = useState(eventIds);
  const [extConfig, setExtConfig] = useState(config);

  const updateMutation = useMutation(
    trpc.extension.updateConfig.mutationOptions({
      onSuccess: () => {
        toast.success("Extension updated");
        queryClient.invalidateQueries({
          queryKey: [["extension", "listForProject"]],
        });
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const testMutation = useMutation(
    trpc.extension.test.mutationOptions({
      onSuccess: () => {
        toast.success("Test event sent!");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const handleSave = () => {
    if (!extensionId) return;

    updateMutation.mutate({
      projectId,
      extensionId,
      config: extensionId === "github" ? extConfig : { webhookUrl },
      eventDefinitionIds: selectedEvents,
    });
  };

  if (!extension) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{extension.metadata?.displayName}</SheetTitle>
            <SheetDescription>
              {extension.metadata?.description}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 p-4">
            {extensionId === "github" ? (
              <GitHubConfig
                organizationId={organizationId}
                projectId={projectId}
                config={extConfig}
                onChange={setExtConfig}
              />
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="webhook-url">Webhook URL</Label>
                  <Input
                    id="webhook-url"
                    type="url"
                    placeholder="https://discord.com/api/webhooks/..."
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                  />
                </div>

                <EventSelector
                  events={eventDefinitions || []}
                  selectedEventIds={selectedEvents}
                  onSelectionChange={setSelectedEvents}
                  onCreateEvent={() => {}}
                />
              </>
            )}

            {extension.lastTriggeredAt && (
              <div className="text-sm text-muted-foreground">
                Last triggered:{" "}
                {new Date(extension.lastTriggeredAt).toLocaleString()}
              </div>
            )}
          </div>

          <SheetFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(true)}
              className="w-full sm:w-auto"
            >
              <Trash2 className="size-4 mr-2" />
              Remove Extension
            </Button>
            <Button
              variant="outline"
              onClick={() => testMutation.mutate({ projectId, extensionId })}
              disabled={testMutation.isPending}
              className="w-full sm:w-auto"
            >
              <TestTube2 className="size-4 mr-2" />
              {testMutation.isPending ? "Testing..." : "Test"}
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="w-full sm:w-auto"
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <DeleteExtensionDialog
        extension={
          extension
            ? {
                id: extension.extensionId,
                name: extension.metadata?.displayName || extension.extensionId,
              }
            : null
        }
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        organizationId={organizationId}
        projectId={projectId}
        onSuccess={() => {
          setDeleteDialogOpen(false);
          onOpenChange(false);
          queryClient.invalidateQueries({
            queryKey: [["extension", "listForProject"]],
          });
        }}
      />
    </>
  );
}
