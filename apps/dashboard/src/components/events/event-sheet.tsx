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
  }, [mode, editingEvent, open]);

  // Auto-generate tracking ID when creating
  useEffect(() => {
    if (mode === "create" && name) {
      const generatedId = toKebabCase(name);
      setTrackingId(generatedId);

      const duplicateName = existingEvents.some(
        (event) => event.name.toLowerCase() === name.toLowerCase(),
      );

      const duplicateTrackingId = existingEvents.some(
        (event) => event.trackingId === generatedId,
      );

      if (duplicateName) {
        setValidationError(
          "An event with this name already exists. Please choose a different name.",
        );
      } else if (duplicateTrackingId) {
        setValidationError(
          "An event with this tracking ID already exists. Please choose a different name.",
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
          event.trackingId === trackingId && event.id !== editingEvent.id,
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
    if (!editingEvent) return;

    updateMutation.mutate({
      id: editingEvent.id,
      name: name || undefined,
      description: description || undefined,
      trackingId: trackingId || undefined,
      organizationId,
    });
  };

  const handleDelete = () => {
    if (!editingEvent) return;
    setOpenDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (!editingEvent || deleteConfirmation !== editingEvent.trackingId) return;
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
        open={open}
        onOpenChange={(isOpen) => {
          // Only allow closing the sheet if the delete dialog is not open
          if (!isOpen && openDeleteDialog) {
            return;
          }
          onOpenChange(isOpen);
        }}
      >
        <SheetContent side="right" onOpenAutoFocus={(e) => e.preventDefault()}>
          <SheetHeader>
            <SheetTitle>
              {mode === "create" ? "Create Event" : "Edit Event"}
            </SheetTitle>
            <SheetDescription>
              Events are used to track user interactions with your website.
            </SheetDescription>
          </SheetHeader>
          <form
            id="event-form"
            onSubmit={mode === "create" ? handleCreate : handleUpdate}
            className="flex flex-col gap-4 w-full px-4 mt-4"
          >
            <div className="flex flex-col gap-1">
              <label htmlFor="name">
                Event Name:
                {mode === "edit" && (
                  <span className="text-sm text-muted-foreground ml-2">
                    (read-only)
                  </span>
                )}
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                readOnly={mode === "edit"}
                className={`w-full border p-2 rounded ${mode === "edit" ? "bg-muted cursor-not-allowed" : ""} ${validationError && mode === "create" ? "border-red-500" : ""}`}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="description">Description (optional):</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border p-2 rounded"
                rows={3}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="trackingId">
                Tracking ID:
                {mode === "create" && (
                  <span className="text-sm text-muted-foreground ml-2">
                    (auto-generated)
                  </span>
                )}
              </label>
              <input
                id="trackingId"
                type="text"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                required
                readOnly={mode === "create"}
                placeholder="e.g., evt_signup_click"
                className={`w-full border p-2 rounded ${mode === "create" ? "bg-muted cursor-not-allowed" : ""} ${validationError ? "border-red-500" : ""}`}
              />
            </div>

            {validationError && (
              <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-md">
                <AlertCircle className="size-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400">
                  {validationError}
                </p>
              </div>
            )}

            {mode === "edit" && editingEvent && (
              <div className="mt-4 p-4 bg-muted rounded-lg space-y-3">
                <div>
                  <p className="font-semibold mb-2">Usage Examples:</p>
                  <p className="text-sm">
                    Simply add the data attribute - all interaction types
                    (click, impression, hover) are tracked automatically!
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">
                    Data attribute (recommended):
                  </p>
                  <CopyInput
                    value={`<button data-bklit-event="${trackingId}">Click Me</button>`}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">ID attribute:</p>
                  <CopyInput
                    value={`<button id="bklit-event-${trackingId}">Click Me</button>`}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">
                    Manual tracking (JavaScript):
                  </p>
                  <CopyInput
                    value={`window.trackEvent("${trackingId}", "custom_event");`}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Manual events don't count toward conversion rates since they
                    may not be user-perceived.
                  </p>
                </div>
              </div>
            )}
          </form>
          <SheetFooter>
            <div className="flex justify-between w-full">
              {mode === "edit" && (
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  type="button"
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete"}
                </Button>
              )}
              <Button
                variant="default"
                form="event-form"
                type="submit"
                disabled={
                  !!validationError ||
                  (mode === "create"
                    ? createMutation.isPending
                    : updateMutation.isPending)
                }
                className="disabled:opacity-50 ml-auto"
              >
                {mode === "create"
                  ? createMutation.isPending
                    ? "Creating..."
                    : "Create Event"
                  : updateMutation.isPending
                    ? "Saving..."
                    : "Save Changes"}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={openDeleteDialog} onOpenChange={handleDeleteDialogChange}>
        <DialogContent>
          <FormPermissions requiredRole={MemberRole.ADMIN} inModal asChild>
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
                htmlFor="delete-confirmation"
                className="text-sm font-medium"
              >
                Type{" "}
                <code className="bg-muted px-1 py-0.5 rounded text-sm">
                  {editingEvent?.trackingId}
                </code>{" "}
                to confirm:
              </label>
              <input
                id="delete-confirmation"
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Enter tracking ID"
                className="w-full border p-2 rounded mt-2"
                autoComplete="off"
              />
            </div>
            <DialogFooter>
              <DialogClose>Cancel</DialogClose>
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  confirmDelete();
                }}
                disabled={
                  deleteConfirmation !== editingEvent?.trackingId ||
                  deleteMutation.isPending
                }
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
