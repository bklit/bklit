"use client";

import { Button } from "@bklit/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@bklit/ui/components/dialog";
import { CopyInput } from "@bklit/ui/components/input-copy";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@bklit/ui/components/sheet";
import { MemberRole } from "@bklit/utils/roles";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createEvent, deleteEvent, updateEvent } from "@/actions/event-actions";
import { FormPermissions } from "@/components/permissions/form-permissions";
import type { EventListItem } from "./types";

function toKebabCase(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface EventSheetProps {
  projectId: string;
  organizationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  editingEvent?: EventListItem | null;
  existingEvents?: EventListItem[];
  onSuccess?: () => void;
}

export function EventSheet({
  projectId,
  organizationId,
  open,
  onOpenChange,
  mode,
  editingEvent,
  existingEvents = [],
  onSuccess,
}: EventSheetProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [trackingId, setTrackingId] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const queryClient = useQueryClient();

  // Initialize form with editing event data
  useEffect(() => {
    if (mode === "edit" && editingEvent) {
      setName(editingEvent.name);
      setDescription(editingEvent.description || "");
      setTrackingId(editingEvent.trackingId);
    } else {
      setName("");
      setDescription("");
      setTrackingId("");
    }
    setValidationError(null);
    setDeleteConfirmation("");
  }, [mode, editingEvent]);

  // Auto-generate tracking ID when creating
  useEffect(() => {
    if (mode === "create" && name) {
      const generatedId = toKebabCase(name);
      setTrackingId(generatedId);

      const duplicateName = existingEvents.some(
        (event) => event.name.toLowerCase() === name.toLowerCase()
      );

      const duplicateTrackingId = existingEvents.some(
        (event) => event.trackingId === generatedId
      );

      if (duplicateName) {
        setValidationError(
          "An event with this name already exists. Please choose a different name."
        );
      } else if (duplicateTrackingId) {
        setValidationError(
          "An event with this tracking ID already exists. Please choose a different name."
        );
      } else {
        setValidationError(null);
      }
    } else if (mode === "create" && !name) {
      setTrackingId("");
      setValidationError(null);
    }
  }, [name, existingEvents, mode]);

  // Validate tracking ID when editing
  useEffect(() => {
    if (mode === "edit" && editingEvent) {
      const duplicateTrackingId = existingEvents.some(
        (event) =>
          event.trackingId === trackingId && event.id !== editingEvent.id
      );

      if (duplicateTrackingId) {
        setValidationError("An event with this tracking ID already exists.");
      } else {
        setValidationError(null);
      }
    }
  }, [trackingId, existingEvents, mode, editingEvent]);

  const createMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      trackingId: string;
      projectId: string;
      organizationId: string;
    }) => {
      const result = await createEvent(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success("Event created successfully!");
      queryClient.invalidateQueries({
        queryKey: [["event", "list"]],
      });
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: {
      id: string;
      name?: string;
      description?: string;
      trackingId?: string;
      organizationId: string;
    }) => {
      const result = await updateEvent(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success("Event updated successfully!");
      queryClient.invalidateQueries({
        queryKey: [["event", "list"]],
      });
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (data: { id: string; organizationId: string }) => {
      const result = await deleteEvent(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      toast.success("Event deleted successfully!");
      queryClient.invalidateQueries({
        queryKey: [["event", "list"]],
      });
      setOpenDeleteDialog(false);
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name,
      description: description || undefined,
      trackingId,
      projectId,
      organizationId,
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) {
      return;
    }

    updateMutation.mutate({
      id: editingEvent.id,
      name: name || undefined,
      description: description || undefined,
      trackingId: trackingId || undefined,
      organizationId,
    });
  };

  const handleDelete = () => {
    if (!editingEvent) {
      return;
    }
    setOpenDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (!editingEvent || deleteConfirmation !== editingEvent.trackingId) {
      return;
    }
    deleteMutation.mutate({ id: editingEvent.id, organizationId });
  };

  const handleDeleteDialogChange = (open: boolean) => {
    setOpenDeleteDialog(open);
    if (!open) {
      setDeleteConfirmation("");
    }
  };

  return (
    <>
      <Sheet
        onOpenChange={(isOpen) => {
          // Only allow closing the sheet if the delete dialog is not open
          if (!isOpen && openDeleteDialog) {
            return;
          }
          onOpenChange(isOpen);
        }}
        open={open}
      >
        <SheetContent onOpenAutoFocus={(e) => e.preventDefault()} side="right">
          <SheetHeader>
            <SheetTitle>
              {mode === "create" ? "Create Event" : "Edit Event"}
            </SheetTitle>
            <SheetDescription>
              Events are used to track user interactions with your website.
            </SheetDescription>
          </SheetHeader>
          <form
            className="mt-4 flex w-full flex-col gap-4 px-4"
            id="event-form"
            onSubmit={mode === "create" ? handleCreate : handleUpdate}
          >
            <div className="flex flex-col gap-1">
              <label htmlFor="name">
                Event Name:
                {mode === "edit" && (
                  <span className="ml-2 text-muted-foreground text-sm">
                    (read-only)
                  </span>
                )}
              </label>
              <input
                className={`w-full rounded border p-2 ${mode === "edit" ? "cursor-not-allowed bg-muted" : ""} ${validationError && mode === "create" ? "border-red-500" : ""}`}
                id="name"
                onChange={(e) => setName(e.target.value)}
                readOnly={mode === "edit"}
                required
                type="text"
                value={name}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="description">Description (optional):</label>
              <textarea
                className="w-full rounded border p-2"
                id="description"
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                value={description}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="trackingId">
                Tracking ID:
                {mode === "create" && (
                  <span className="ml-2 text-muted-foreground text-sm">
                    (auto-generated)
                  </span>
                )}
              </label>
              <input
                className={`w-full rounded border p-2 ${mode === "create" ? "cursor-not-allowed bg-muted" : ""} ${validationError ? "border-red-500" : ""}`}
                id="trackingId"
                onChange={(e) => setTrackingId(e.target.value)}
                placeholder="e.g., evt_signup_click"
                readOnly={mode === "create"}
                required
                type="text"
                value={trackingId}
              />
            </div>

            {validationError && (
              <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/20">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-600 dark:text-red-400" />
                <p className="text-red-600 text-sm dark:text-red-400">
                  {validationError}
                </p>
              </div>
            )}

            {mode === "edit" && editingEvent && (
              <div className="mt-4 space-y-3 rounded-lg bg-muted p-4">
                <div>
                  <p className="mb-2 font-semibold">Usage Examples:</p>
                  <p className="text-sm">
                    Simply add the data attribute - all interaction types
                    (click, impression, hover) are tracked automatically!
                  </p>
                </div>
                <div>
                  <p className="mb-2 font-medium text-sm">
                    Data attribute (recommended):
                  </p>
                  <CopyInput
                    value={`<button data-bklit-event="${trackingId}">Click Me</button>`}
                  />
                </div>
                <div>
                  <p className="mb-2 font-medium text-sm">ID attribute:</p>
                  <CopyInput
                    value={`<button id="bklit-event-${trackingId}">Click Me</button>`}
                  />
                </div>
                <div>
                  <p className="mb-2 font-medium text-sm">
                    Manual tracking (JavaScript):
                  </p>
                  <CopyInput
                    value={`window.trackEvent("${trackingId}", "custom_event");`}
                  />
                  <p className="mt-2 text-muted-foreground text-xs">
                    Manual events don't count toward conversion rates since they
                    may not be user-perceived.
                  </p>
                </div>
              </div>
            )}
          </form>
          <SheetFooter>
            <div className="flex w-full justify-between">
              {mode === "edit" && (
                <Button
                  disabled={deleteMutation.isPending}
                  onClick={handleDelete}
                  type="button"
                  variant="destructive"
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete"}
                </Button>
              )}
              <Button
                className="ml-auto disabled:opacity-50"
                disabled={
                  !!validationError ||
                  (mode === "create"
                    ? createMutation.isPending
                    : updateMutation.isPending)
                }
                form="event-form"
                type="submit"
                variant="default"
              >
                {(() => {
                  if (mode === "create") {
                    return createMutation.isPending ? "Creating..." : "Create Event";
                  }
                  return updateMutation.isPending ? "Saving..." : "Save Changes";
                })()}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog onOpenChange={handleDeleteDialogChange} open={openDeleteDialog}>
        <DialogContent>
          <FormPermissions asChild inModal requiredRole={MemberRole.ADMIN}>
            <DialogHeader>
              <DialogTitle>Delete Event</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete the
                event <strong>"{editingEvent?.name}"</strong> and all associated
                tracked event data.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <label
                className="font-medium text-sm"
                htmlFor="delete-confirmation"
              >
                Type{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-sm">
                  {editingEvent?.trackingId}
                </code>{" "}
                to confirm:
              </label>
              <input
                autoComplete="off"
                className="mt-2 w-full rounded border p-2"
                id="delete-confirmation"
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Enter tracking ID"
                type="text"
                value={deleteConfirmation}
              />
            </div>
            <DialogFooter>
              <DialogClose>Cancel</DialogClose>
              <Button
                disabled={
                  deleteConfirmation !== editingEvent?.trackingId ||
                  deleteMutation.isPending
                }
                onClick={(e) => {
                  e.preventDefault();
                  confirmDelete();
                }}
                variant="destructive"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete Event"}
              </Button>
            </DialogFooter>
          </FormPermissions>
        </DialogContent>
      </Dialog>
    </>
  );
}
