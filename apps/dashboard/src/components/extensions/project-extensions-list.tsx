"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bklit/ui/components/card";
import { Button } from "@bklit/ui/components/button";
import { Input } from "@bklit/ui/components/input";
import { Label } from "@bklit/ui/components/label";
import { Switch } from "@bklit/ui/components/switch";
import { Badge } from "@bklit/ui/components/badge";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@bklit/ui/components/dialog";
import { EventSelector } from "@/components/extensions/event-selector";
import { Trash2, TestTube2, Settings as SettingsIcon } from "lucide-react";
import { useState } from "react";
import { useTRPC } from "@/trpc/react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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

  const { data: eventDefinitions } = useQuery({
    ...trpc.event.list.queryOptions({ projectId, organizationId }),
  });

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
      projectId,
      extensionId: extensionToDelete.id,
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

  const [editingExtension, setEditingExtension] = useState<string | null>(null);
  const [configValues, setConfigValues] = useState<Record<string, Record<string, unknown>>>({});
  const [selectedEvents, setSelectedEvents] = useState<Record<string, string[]>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [extensionToDelete, setExtensionToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const handleConfigure = (extensionId: string, config: Record<string, unknown>, eventIds: string[]) => {
    setEditingExtension(extensionId);
    setConfigValues((prev) => ({ ...prev, [extensionId]: config }));
    setSelectedEvents((prev) => ({ ...prev, [extensionId]: eventIds }));
  };

  const handleSave = (extensionId: string) => {
    updateMutation.mutate({
      projectId,
      extensionId,
      config: configValues[extensionId] || {},
      eventDefinitionIds: selectedEvents[extensionId] || [],
    });
    setEditingExtension(null);
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
          const isEditing = editingExtension === ext.extensionId;
          const config = (ext.config as Record<string, unknown>) || {};
          const eventIds = ext.eventDefinitions?.map((e) => e.id) || [];

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
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor={`webhook-${ext.extensionId}`}>
                        Webhook URL
                      </Label>
                      <Input
                        id={`webhook-${ext.extensionId}`}
                        type="url"
                        placeholder="https://discord.com/api/webhooks/..."
                        value={(configValues[ext.extensionId]?.webhookUrl as string) || ""}
                        onChange={(e) =>
                          setConfigValues((prev) => ({
                            ...prev,
                            [ext.extensionId]: {
                              ...prev[ext.extensionId],
                              webhookUrl: e.target.value,
                            },
                          }))
                        }
                      />
                    </div>

                    <EventSelector
                      events={eventDefinitions || []}
                      selectedEventIds={selectedEvents[ext.extensionId] || []}
                      onSelectionChange={(ids) =>
                        setSelectedEvents((prev) => ({
                          ...prev,
                          [ext.extensionId]: ids,
                        }))
                      }
                    />

                    <div className="flex gap-2">
                      <Button onClick={() => handleSave(ext.extensionId)}>
                        Save Configuration
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setEditingExtension(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-sm space-y-2">
                      <div>
                        <span className="font-medium">Webhook URL:</span>{" "}
                        <span className="text-muted-foreground">
                          {config.webhookUrl ? "Configured" : "Not configured"}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Events:</span>{" "}
                        <span className="text-muted-foreground">
                          {eventIds.length} event{eventIds.length !== 1 ? "s" : ""} selected
                        </span>
                      </div>
                      {ext.lastTriggeredAt && (
                        <div>
                          <span className="font-medium">Last triggered:</span>{" "}
                          <span className="text-muted-foreground">
                            {new Date(ext.lastTriggeredAt).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleConfigure(ext.extensionId, config, eventIds)}
                      >
                        <SettingsIcon className="size-4 mr-2" />
                        Configure
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          testMutation.mutate({
                            projectId,
                            extensionId: ext.extensionId,
                          })
                        }
                        disabled={!config.webhookUrl}
                      >
                        <TestTube2 className="size-4 mr-2" />
                        Test
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Remove Extension: {extensionToDelete?.name}</DialogTitle>
            <DialogDescription>
              This will remove the extension from this project. To confirm, please
              enter &quot;
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
    </div>
  );
}

