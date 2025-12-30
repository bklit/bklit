"use client";

import { Badge } from "@bklit/ui/components/badge";
import { Button } from "@bklit/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@bklit/ui/components/dialog";
import { Input } from "@bklit/ui/components/input";
import { Label } from "@bklit/ui/components/label";
import { Switch } from "@bklit/ui/components/switch";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TestTube2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { EventSheet } from "@/components/events/event-sheet";
import { EventSelector } from "@/components/extensions/event-selector";
import { useTRPC } from "@/trpc/react";

interface ProjectExtensionsListProps {
  organizationId: string;
  projectId: string;
}

export function ProjectExtensionsList({
  organizationId,
  projectId,
}: ProjectExtensionsListProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: extensions, isLoading } = useQuery({
    ...trpc.extension.listForProject.queryOptions({ projectId }),
  });

  const { data: eventDefinitions, refetch: refetchEvents } = useQuery({
    ...trpc.event.list.queryOptions({ projectId, organizationId }),
  });

  const [eventSheetOpen, setEventSheetOpen] = useState(false);

  const updateMutation = useMutation(
    trpc.extension.updateConfig.mutationOptions({
      onSuccess: () => {
        toast.success("Extension updated");
        queryClient.invalidateQueries({
          queryKey: [["extension", "listForProject"]],
        });
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const toggleMutation = useMutation(
    trpc.extension.toggle.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [["extension", "listForProject"]],
        });
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const removeMutation = useMutation(
    trpc.extension.remove.mutationOptions({
      onSuccess: () => {
        toast.success("Extension removed");
        queryClient.invalidateQueries({
          queryKey: [["extension", "listForProject"]],
        });
        setDeleteDialogOpen(false);
        setExtensionToDelete(null);
        setDeleteConfirmation("");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const handleRemoveClick = (extensionId: string, displayName: string) => {
    setExtensionToDelete({ id: extensionId, name: displayName });
    setDeleteDialogOpen(true);
  };

  const handleConfirmRemove = () => {
    if (!extensionToDelete || deleteConfirmation !== extensionToDelete.name) {
      toast.error("Extension name does not match");
      return;
    }

    removeMutation.mutate({
      organizationId,
      extensionId: extensionToDelete.id,
      projectIds: [projectId],
    });
  };

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

  const [configValues, setConfigValues] = useState<
    Record<string, Record<string, unknown>>
  >({});
  const [selectedEvents, setSelectedEvents] = useState<
    Record<string, string[]>
  >({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [extensionToDelete, setExtensionToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const handleSave = (
    extensionId: string,
    defaultConfig: Record<string, unknown>,
    defaultEventIds: string[],
  ) => {
    updateMutation.mutate({
      projectId,
      extensionId,
      config: configValues[extensionId] || defaultConfig,
      eventDefinitionIds: selectedEvents[extensionId] || defaultEventIds,
    });
  };

  if (isLoading) {
    return <div className="container mx-auto">Loading...</div>;
  }

  return (
    <div className="container mx-auto space-y-6">
      {!extensions || extensions.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Extensions</CardTitle>
            <CardDescription>
              No extensions have been activated for this project yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <a href={`/${organizationId}/extensions`}>Browse Extensions</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        extensions.map((ext) => {
          const config = (ext.config as Record<string, unknown>) || {};
          const eventIds = ext.eventDefinitions?.map((e) => e.id) || [];
          const currentWebhookUrl =
            (configValues[ext.extensionId]?.webhookUrl as string) ||
            (config.webhookUrl as string) ||
            "";
          const currentEventIds = selectedEvents[ext.extensionId] || eventIds;

          return (
            <Card key={ext.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {ext.metadata?.displayName || ext.extensionId}
                      {ext.enabled ? (
                        <Badge variant="default" className="bg-green-500">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Disabled</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {ext.metadata?.description}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={ext.enabled}
                      onCheckedChange={(enabled) =>
                        toggleMutation.mutate({
                          projectId,
                          extensionId: ext.extensionId,
                          enabled,
                        })
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        handleRemoveClick(
                          ext.extensionId,
                          ext.metadata?.displayName || ext.extensionId,
                        )
                      }
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor={`webhook-${ext.extensionId}`}>
                    Webhook URL
                  </Label>
                  <Input
                    id={`webhook-${ext.extensionId}`}
                    type="url"
                    placeholder="https://discord.com/api/webhooks/..."
                    value={currentWebhookUrl}
                    onChange={(e) =>
                      setConfigValues((prev) => ({
                        ...prev,
                        [ext.extensionId]: {
                          webhookUrl: e.target.value,
                        },
                      }))
                    }
                  />
                </div>

                <EventSelector
                  events={eventDefinitions || []}
                  selectedEventIds={currentEventIds}
                  onSelectionChange={(ids) =>
                    setSelectedEvents((prev) => ({
                      ...prev,
                      [ext.extensionId]: ids,
                    }))
                  }
                  onCreateEvent={() => setEventSheetOpen(true)}
                />

                {ext.lastTriggeredAt && (
                  <div className="text-sm text-muted-foreground">
                    Last triggered:{" "}
                    {new Date(ext.lastTriggeredAt).toLocaleString()}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={() =>
                      handleSave(ext.extensionId, config, eventIds)
                    }
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending
                      ? "Saving..."
                      : "Save Configuration"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      testMutation.mutate({
                        projectId,
                        extensionId: ext.extensionId,
                      })
                    }
                    disabled={!currentWebhookUrl || testMutation.isPending}
                  >
                    <TestTube2 className="size-4 mr-2" />
                    {testMutation.isPending ? "Testing..." : "Test"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              Remove Extension: {extensionToDelete?.name}
            </DialogTitle>
            <DialogDescription>
              This will remove the extension from this project. To confirm,
              please enter &quot;
              <span className="font-semibold">{extensionToDelete?.name}</span>
              &quot; below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label
                htmlFor="extension-name-confirmation"
                className="text-right sr-only"
              >
                Extension Name
              </Label>
              <Input
                id="extension-name-confirmation"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder={extensionToDelete?.name}
                className="col-span-4"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button
                variant="outline"
                disabled={removeMutation.isPending}
                onClick={() => {
                  setDeleteConfirmation("");
                  setExtensionToDelete(null);
                }}
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleConfirmRemove}
              disabled={
                removeMutation.isPending ||
                deleteConfirmation !== extensionToDelete?.name
              }
            >
              {removeMutation.isPending ? "Removing..." : "Remove Extension"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EventSheet
        projectId={projectId}
        organizationId={organizationId}
        open={eventSheetOpen}
        onOpenChange={setEventSheetOpen}
        mode="create"
        existingEvents={eventDefinitions}
        onSuccess={() => refetchEvents()}
      />
    </div>
  );
}
