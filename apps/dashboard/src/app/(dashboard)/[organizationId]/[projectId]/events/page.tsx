"use client";

import { Button } from "@bklit/ui/components/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@bklit/ui/components/sheet";
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
import { Calendar, Clock, Monitor, User } from "lucide-react";
import { use, useState } from "react";
import { createEvent, deleteEvent, updateEvent } from "@/actions/event-actions";
import { PageHeader } from "@/components/page-header";
import { Stats } from "@/components/stats";
import { useTRPC } from "@/trpc/react";

interface PageProps {
  params: Promise<{
    organizationId: string;
    projectId: string;
  }>;
}

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
    metadata: unknown;
  }>;
}

export default function EventsPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { organizationId, projectId } = resolvedParams;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [trackingId, setTrackingId] = useState("");
  const [editingEvent, setEditingEvent] = useState<EventListItem | null>(null);
  const [openEventsSheet, setOpenEventsSheet] = useState(false);
  const [sheetMode, setSheetMode] = useState<"create" | "edit">("create");

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: events, isLoading } = useQuery(
    trpc.event.list.queryOptions({
      projectId,
      organizationId,
    }),
  );

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
        queryKey: [["event", "list"], { input: { projectId, organizationId } }],
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
        queryKey: [["event", "list"], { input: { projectId, organizationId } }],
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
      queryClient.invalidateQueries({
        queryKey: [["event", "list"], { input: { projectId, organizationId } }],
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

    if (
      confirm(
        `Are you sure you want to delete "${editingEvent.name}"? This will delete all tracked event data.`,
      )
    ) {
      deleteMutation.mutate({ id: editingEvent.id, organizationId });
    }
  };

  const openCreateSheet = () => {
    setSheetMode("create");
    setEditingEvent(null);
    setName("");
    setDescription("");
    setTrackingId("");
    setOpenEventsSheet(true);
  };

  const openEditSheet = (event: EventListItem) => {
    setSheetMode("edit");
    setEditingEvent(event);
    setName(event.name);
    setDescription(event.description || "");
    setTrackingId(event.trackingId);
    setOpenEventsSheet(true);
  };

  const handleView = () => {
    console.log("event view");
  };

  return (
    <>
      <PageHeader title="Events" description="Manage your events">
        <Button onClick={openCreateSheet}>Create Event</Button>
      </PageHeader>

      <Sheet open={openEventsSheet} onOpenChange={setOpenEventsSheet}>
        <SheetContent side="right">
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
              <label htmlFor="name">Event Name:</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full border p-2 rounded"
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
              <label htmlFor="trackingId">Tracking ID:</label>
              <input
                id="trackingId"
                type="text"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                required
                placeholder="e.g., evt_signup_click"
                className="w-full border p-2 rounded"
              />
            </div>

            {sheetMode === "edit" && editingEvent && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="font-semibold mb-2">Usage Examples:</p>
                <p className="text-sm mt-2">
                  Simply add the data attribute - all interaction types (click,
                  view, hover) are tracked automatically!
                </p>
                <p className="text-sm mt-3 font-medium">
                  Data attribute (recommended):
                </p>
                <code className="block bg-background font-mono p-2 text-sm mt-1 rounded">
                  {`<button data-bklit-event="${trackingId}">Click Me</button>`}
                </code>
                <p className="text-sm mt-3 font-medium">ID attribute:</p>
                <code className="block bg-background font-mono p-2 text-sm mt-1 rounded">
                  {`<button id="bklit-event-${trackingId}">Click Me</button>`}
                </code>
                <p className="text-sm mt-3 font-medium">
                  Manual tracking (JavaScript):
                </p>
                <code className="block bg-background font-mono p-2 text-sm mt-1 rounded">
                  {`window.trackEvent("${trackingId}", "custom_event");`}
                </code>
              </div>
            )}
          </form>
          <SheetFooter className="mt-4">
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
                  sheetMode === "create"
                    ? createMutation.isPending
                    : updateMutation.isPending
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
              icon: Calendar,
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

        {isLoading && <p>Loading events...</p>}
        {events && events.length === 0 && <p>No events created yet.</p>}
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
                      <Button variant="outline" size="lg" onClick={handleView}>
                        View
                      </Button>
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
    </>
  );
}
