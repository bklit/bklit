"use client";

import type { Prisma } from "@bklit/db/client";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@bklit/ui/components/alert-dialog";
import { Button } from "@bklit/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@bklit/ui/components/empty";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@bklit/ui/components/sheet";
import { Spinner } from "@bklit/ui/components/spinner";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@bklit/ui/components/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AlertCircle,
  CalendarIcon,
  Clock,
  Monitor,
  User,
} from "lucide-react";
import Link from "next/link";
import { parseAsIsoDateTime, useQueryStates } from "nuqs";
import { useEffect, useMemo, useState } from "react";
import { createEvent, deleteEvent, updateEvent } from "@/actions/event-actions";
import { CopyInput } from "@/components/copy-input";
import { DateRangePicker } from "@/components/date-range-picker";
import { PageHeader } from "@/components/page-header";
import { Stats } from "@/components/stats";
import { useTRPC } from "@/trpc/react";

interface EventListItem {
  id: string;
  name: string;
  description: string | null;
  trackingId: string;
  createdAt: Date;
  updatedAt: Date;
  totalCount: number;
  eventTypeCounts: Record<string, number>;
  recentEvents: Array<{
    id: string;
    timestamp: Date;
    metadata: Prisma.JsonValue | null;
  }>;
}

function toKebabCase(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface EventsProps {
  organizationId: string;
  projectId: string;
}

export function Events({ organizationId, projectId }: EventsProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [trackingId, setTrackingId] = useState("");
  const [editingEvent, setEditingEvent] = useState<EventListItem | null>(null);
  const [openEventsSheet, setOpenEventsSheet] = useState(false);
  const [sheetMode, setSheetMode] = useState<"create" | "edit">("create");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  // Date range state using nuqs
  const [dateParams] = useQueryStates(
    {
      startDate: parseAsIsoDateTime,
      endDate: parseAsIsoDateTime,
    },
    {
      history: "push",
    },
  );

  const startDate = useMemo(() => {
    if (dateParams.startDate) return dateParams.startDate;
    if (!dateParams.endDate) return undefined;
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  }, [dateParams.startDate, dateParams.endDate]);

  const endDate = dateParams.endDate ?? undefined;

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: events, isLoading } = useQuery(
    trpc.event.list.queryOptions({
      projectId,
      organizationId,
      startDate,
      endDate,
    }),
  );

  useEffect(() => {
    if (sheetMode === "create" && name) {
      const generatedId = toKebabCase(name);
      setTrackingId(generatedId);

      const duplicateName = events?.some(
        (event) => event.name.toLowerCase() === name.toLowerCase(),
      );

      const duplicateTrackingId = events?.some(
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
    } else if (sheetMode === "create" && !name) {
      setTrackingId("");
      setValidationError(null);
    }
  }, [name, events, sheetMode]);

  useEffect(() => {
    if (sheetMode === "edit" && editingEvent) {
      // Name is read-only in edit mode, so only check tracking ID
      const duplicateTrackingId = events?.some(
        (event) =>
          event.trackingId === trackingId && event.id !== editingEvent.id,
      );

      if (duplicateTrackingId) {
        setValidationError("An event with this tracking ID already exists.");
      } else {
        setValidationError(null);
      }
    }
  }, [trackingId, events, sheetMode, editingEvent]);

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
      setName("");
      setDescription("");
      setTrackingId("");
      setOpenEventsSheet(false);
      queryClient.invalidateQueries({
        queryKey: [["event", "list"]],
      });
    },
    onError: (error: Error) => {
      alert(`Error creating event: ${error.message}`);
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
      setEditingEvent(null);
      setOpenEventsSheet(false);
      setName("");
      setDescription("");
      setTrackingId("");
      queryClient.invalidateQueries({
        queryKey: [["event", "list"]],
      });
    },
    onError: (error: Error) => {
      alert(`Error updating event: ${error.message}`);
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
      setOpenDeleteDialog(false);
      setOpenEventsSheet(false);
      setDeleteConfirmation("");
      setEditingEvent(null);
      queryClient.invalidateQueries({
        queryKey: [["event", "list"]],
      });
    },
    onError: (error: Error) => {
      alert(`Error deleting event: ${error.message}`);
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
      // Reset confirmation when dialog closes
      setDeleteConfirmation("");
    }
  };

  const openCreateSheet = () => {
    setSheetMode("create");
    setEditingEvent(null);
    setName("");
    setDescription("");
    setTrackingId("");
    setValidationError(null);
    setOpenEventsSheet(true);
  };

  const openEditSheet = (event: EventListItem) => {
    setSheetMode("edit");
    setEditingEvent(event);
    setName(event.name);
    setDescription(event.description || "");
    setTrackingId(event.trackingId);
    setValidationError(null);
    setDeleteConfirmation("");
    setOpenEventsSheet(true);
  };

  return (
    <>
      <PageHeader title="Events" description="Manage your events">
        <div className="flex items-center gap-2">
          <DateRangePicker />
          <Button onClick={openCreateSheet}>Create Event</Button>
        </div>
      </PageHeader>

      <Sheet
        open={openEventsSheet}
        onOpenChange={(open) => {
          // Only allow closing the sheet if the delete dialog is not open
          if (!open && openDeleteDialog) {
            return;
          }
          setOpenEventsSheet(open);
          if (!open) {
            // Reset form state when sheet closes
            setEditingEvent(null);
            setName("");
            setDescription("");
            setTrackingId("");
            setValidationError(null);
          }
        }}
      >
        <SheetContent side="right" onOpenAutoFocus={(e) => e.preventDefault()}>
          <SheetHeader>
            <SheetTitle>
              {sheetMode === "create" ? "Create Event" : "Edit Event"}
            </SheetTitle>
            <SheetDescription>
              Events are used to track user interactions with your website.
            </SheetDescription>
          </SheetHeader>
          <form
            id="event-form"
            onSubmit={sheetMode === "create" ? handleCreate : handleUpdate}
            className="flex flex-col gap-4 w-full px-4 mt-4"
          >
            <div className="flex flex-col gap-1">
              <label htmlFor="name">
                Event Name:
                {sheetMode === "edit" && (
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
                readOnly={sheetMode === "edit"}
                className={`w-full border p-2 rounded ${sheetMode === "edit" ? "bg-muted cursor-not-allowed" : ""} ${validationError && sheetMode === "create" ? "border-red-500" : ""}`}
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
                {sheetMode === "create" && (
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
                readOnly={sheetMode === "create"}
                placeholder="e.g., evt_signup_click"
                className={`w-full border p-2 rounded ${sheetMode === "create" ? "bg-muted cursor-not-allowed" : ""} ${validationError ? "border-red-500" : ""}`}
              />
            </div>

            {validationError && (
              <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-md">
                <AlertCircle className="size-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400">
                  {validationError}
                </p>
              </div>
            )}

            {sheetMode === "edit" && editingEvent && (
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
              {sheetMode === "edit" && (
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
                  (sheetMode === "create"
                    ? createMutation.isPending
                    : updateMutation.isPending)
                }
                className="disabled:opacity-50 ml-auto"
              >
                {sheetMode === "create"
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

      <div className="container mx-auto py-6 px-4 gap-4 flex flex-col">
        <Stats
          items={[
            {
              icon: Clock,
              name: "Total Events",
              stat: events?.length || 0,
            },
            {
              icon: Monitor,
              name: "Total Interactions",
              stat: events?.reduce((sum, e) => sum + e.totalCount, 0) || 0,
            },
            {
              icon: User,
              name: "Avg Interactions",
              stat: events?.length
                ? Math.round(
                    events.reduce((sum, e) => sum + e.totalCount, 0) /
                      events.length,
                  )
                : 0,
            },
            {
              icon: CalendarIcon,
              name: "Interactions today",
              stat:
                events?.reduce((sum, e) => {
                  const today = e.recentEvents.filter(
                    (re) =>
                      new Date(re.timestamp) >
                      new Date(Date.now() - 24 * 60 * 60 * 1000),
                  ).length;
                  return sum + today;
                }, 0) || 0,
            },
          ]}
        />

        {isLoading && (
          <div className="space-y-4">
            <Empty className="border border-bklit-600 bg-bklit-900">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Spinner />
                </EmptyMedia>
                <EmptyTitle>Loading events...</EmptyTitle>
              </EmptyHeader>
              <EmptyContent>
                <EmptyDescription>Fetching your events</EmptyDescription>
              </EmptyContent>
            </Empty>
          </div>
        )}
        {events && events.length === 0 && (
          <Empty className="border border-bklit-600 bg-bklit-900">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Activity size={16} />
              </EmptyMedia>
              <EmptyTitle>No events found</EmptyTitle>
            </EmptyHeader>
            <EmptyContent>
              <EmptyDescription>
                No events found for the selected date range.
              </EmptyDescription>
            </EmptyContent>
          </Empty>
        )}
        {events && events.length > 0 && (
          <Table>
            <TableCaption className="sr-only">
              A list of your events
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Tracking ID</TableHead>
                <TableHead>Interactions</TableHead>
                <TableHead className="text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">{event.name}</TableCell>
                  <TableCell>
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {event.trackingId}
                    </code>
                  </TableCell>
                  <TableCell className="font-mono">
                    {event.totalCount}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Link
                        href={`/${organizationId}/${projectId}/events/${event.trackingId}`}
                      >
                        <Button variant="outline" size="lg">
                          View
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => openEditSheet(event)}
                      >
                        Edit
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <AlertDialog
        open={openDeleteDialog}
        onOpenChange={handleDeleteDialogChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              event <strong>"{editingEvent?.name}"</strong> and all associated
              tracked event data.
            </AlertDialogDescription>
          </AlertDialogHeader>
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
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
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
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
