"use client";

import type { Prisma } from "@bklit/db/client";
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
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@bklit/ui/components/empty";
import { CopyInput } from "@bklit/ui/components/input-copy";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@bklit/ui/components/tooltip";
import { MemberRole } from "@bklit/utils/roles";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AlertCircle,
  CalendarIcon,
  Clock,
  Info,
  Monitor,
  User,
} from "lucide-react";
import Link from "next/link";
import { parseAsIsoDateTime, useQueryStates } from "nuqs";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { createEvent, deleteEvent, updateEvent } from "@/actions/event-actions";
import { DateRangePicker } from "@/components/date-range-picker";
import { PageHeader } from "@/components/header/page-header";
import { FormPermissions } from "@/components/permissions/form-permissions";
import { Stats } from "@/components/stats";
import { useTRPC } from "@/trpc/react";
import { EventsChart } from "./events-chart";

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
    sessionId: string | null;
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
    }
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

  // Total sessions in range for conversion rate baseline
  const { data: sessionsStats } = useQuery(
    trpc.session.getStats.queryOptions({
      projectId,
      organizationId,
      startDate,
      endDate,
    })
  );

  const { data: events, isLoading } = useQuery(
    trpc.event.list.queryOptions({
      projectId,
      organizationId,
      startDate,
      endDate,
    })
  );

  useEffect(() => {
    if (sheetMode === "create" && name) {
      const generatedId = toKebabCase(name);
      setTrackingId(generatedId);

      const duplicateName = events?.some(
        (event) => event.name.toLowerCase() === name.toLowerCase()
      );

      const duplicateTrackingId = events?.some(
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
          event.trackingId === trackingId && event.id !== editingEvent.id
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
      toast.success("Event created successfully!");
      setName("");
      setDescription("");
      setTrackingId("");
      setOpenEventsSheet(false);
      queryClient.invalidateQueries({
        queryKey: [["event", "list"]],
      });
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
      setOpenDeleteDialog(false);
      setOpenEventsSheet(false);
      setDeleteConfirmation("");
      setEditingEvent(null);
      queryClient.invalidateQueries({
        queryKey: [["event", "list"]],
      });
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
      <PageHeader description="Manage your events" title="Events">
        <div className="flex items-center gap-2">
          <DateRangePicker />
          <Button onClick={openCreateSheet}>Create Event</Button>
        </div>
      </PageHeader>

      <Sheet
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
        open={openEventsSheet}
      >
        <SheetContent onOpenAutoFocus={(e) => e.preventDefault()} side="right">
          <SheetHeader>
            <SheetTitle>
              {sheetMode === "create" ? "Create Event" : "Edit Event"}
            </SheetTitle>
            <SheetDescription>
              Events are used to track user interactions with your website.
            </SheetDescription>
          </SheetHeader>
          <form
            className="mt-4 flex w-full flex-col gap-4 px-4"
            id="event-form"
            onSubmit={sheetMode === "create" ? handleCreate : handleUpdate}
          >
            <div className="flex flex-col gap-1">
              <label htmlFor="name">
                Event Name:
                {sheetMode === "edit" && (
                  <span className="ml-2 text-muted-foreground text-sm">
                    (read-only)
                  </span>
                )}
              </label>
              <input
                className={`w-full rounded border p-2 ${sheetMode === "edit" ? "cursor-not-allowed bg-muted" : ""} ${validationError && sheetMode === "create" ? "border-red-500" : ""}`}
                id="name"
                onChange={(e) => setName(e.target.value)}
                readOnly={sheetMode === "edit"}
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
                {sheetMode === "create" && (
                  <span className="ml-2 text-muted-foreground text-sm">
                    (auto-generated)
                  </span>
                )}
              </label>
              <input
                className={`w-full rounded border p-2 ${sheetMode === "create" ? "cursor-not-allowed bg-muted" : ""} ${validationError ? "border-red-500" : ""}`}
                id="trackingId"
                onChange={(e) => setTrackingId(e.target.value)}
                placeholder="e.g., evt_signup_click"
                readOnly={sheetMode === "create"}
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

            {sheetMode === "edit" && editingEvent && (
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
              {sheetMode === "edit" && (
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
                  (sheetMode === "create"
                    ? createMutation.isPending
                    : updateMutation.isPending)
                }
                form="event-form"
                type="submit"
                variant="default"
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

      <div className="container mx-auto flex flex-col gap-4">
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
                      events.length
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
                      new Date(Date.now() - 24 * 60 * 60 * 1000)
                  ).length;
                  return sum + today;
                }, 0) || 0,
            },
          ]}
        />

        <EventsChart organizationId={organizationId} projectId={projectId} />

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
        {events && Array.isArray(events) && events.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Events</CardTitle>
              <CardDescription>A list of your events</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableCaption className="sr-only">
                  A list of your events
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Tracking ID</TableHead>
                    <TableHead>Total Sessions</TableHead>
                    <TableHead>
                      <div className="flex items-center gap-2">
                        Sessions with Event
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="size-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            Number of unique sessions that triggered this
                            specific event.
                            <br />
                            Multiple triggers within the same session count as
                            one.
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-2">
                        Conversion Rate
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="size-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            Conversion rate = sessions with event / total
                            sessions in range.
                            <br />
                            One conversion per session maximum.
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableHead>
                    <TableHead className="text-right">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => {
                    const uniqueSessionsCount = event.uniqueSessionsCount ?? 0;
                    // Conversion rate: sessions with event / total sessions in range
                    // This shows what percentage of all sessions triggered this event
                    const totalSessionsInRange =
                      sessionsStats?.totalSessions ?? 0;
                    const conversionRate =
                      totalSessionsInRange > 0
                        ? (uniqueSessionsCount / totalSessionsInRange) * 100
                        : 0;
                    return (
                      <TableRow key={event.id}>
                        <TableCell className="font-medium">
                          {event.name}
                        </TableCell>
                        <TableCell>
                          <code className="rounded bg-muted px-2 py-1 text-sm">
                            {event.trackingId}
                          </code>
                        </TableCell>
                        <TableCell>{totalSessionsInRange}</TableCell>
                        <TableCell>{uniqueSessionsCount}</TableCell>
                        <TableCell className="font-mono">
                          <Badge
                            size="lg"
                            variant={
                              conversionRate > 75
                                ? "success"
                                : conversionRate > 35
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {conversionRate.toFixed(0)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Link
                              href={`/${organizationId}/${projectId}/events/${event.trackingId}`}
                            >
                              <Button size="lg" variant="secondary">
                                View
                              </Button>
                            </Link>
                            <Button
                              onClick={() => openEditSheet(event)}
                              size="lg"
                              variant="outline"
                            >
                              Edit
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

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
