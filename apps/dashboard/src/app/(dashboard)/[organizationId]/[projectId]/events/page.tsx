"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { use, useState } from "react";
import { createEvent, deleteEvent, updateEvent } from "@/actions/event-actions";
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
  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTrackingId, setEditTrackingId] = useState("");

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

  const handleUpdate = (e: React.FormEvent, eventId: string) => {
    e.preventDefault();
    updateMutation.mutate({
      id: eventId,
      name: editName || undefined,
      description: editDescription || undefined,
      trackingId: editTrackingId || undefined,
      organizationId,
    });
  };

  const handleDelete = (eventId: string, eventName: string) => {
    if (
      confirm(
        `Are you sure you want to delete "${eventName}"? This will delete all tracked event data.`,
      )
    ) {
      deleteMutation.mutate({ id: eventId, organizationId });
    }
  };

  const startEditing = (event: EventListItem) => {
    setEditingEvent(event.id);
    setEditName(event.name);
    setEditDescription(event.description || "");
    setEditTrackingId(event.trackingId);
  };

  return (
    <div className="container mx-auto py-6 px-4 flex flex-col gap-4">
      <h2 className="text-2xl font-bold">Create Event</h2>
      <form onSubmit={handleCreate} className="flex flex-col gap-2 max-w-md">
        <div className="flex flex-col gap-1">
          <label htmlFor="name">Event Name:</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full border p-2"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="description">Description (optional):</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border p-2"
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
            className="w-full border p-2"
          />
        </div>
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="disabled:opacity-50"
        >
          {createMutation.isPending ? "Creating..." : "Create Event"}
        </button>
      </form>

      <hr />

      <h2 className="text-2xl font-bold">Events List</h2>
      {isLoading && <p>Loading events...</p>}
      {events && events.length === 0 && <p>No events created yet.</p>}
      {events && events.length > 0 && (
        <div className="flex flex-col gap-4">
          {events.map((event) => (
            <div key={event.id} className="border p-4">
              {editingEvent === event.id ? (
                <form
                  onSubmit={(e) => handleUpdate(e, event.id)}
                  className="flex flex-col gap-2"
                >
                  <div className="flex flex-col gap-1">
                    <label htmlFor="edit-name">Event Name:</label>
                    <input
                      id="edit-name"
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full border p-2"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label htmlFor="edit-description">Description:</label>
                    <textarea
                      id="edit-description"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full border p-2"
                      rows={3}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label htmlFor="edit-trackingId">Tracking ID:</label>
                    <input
                      id="edit-trackingId"
                      type="text"
                      value={editTrackingId}
                      onChange={(e) => setEditTrackingId(e.target.value)}
                      className="w-full border p-2"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={updateMutation.isPending}
                      className="disabled:opacity-50"
                    >
                      {updateMutation.isPending ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingEvent(null)}
                      className="disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <h3 className="text-xl font-semibold">{event.name}</h3>
                  {event.description && <p>{event.description}</p>}
                  <p>Tracking ID: {event.trackingId}</p>
                  <p className="font-bold">
                    Total Interactions: {event.totalCount}
                  </p>

                  {Object.keys(event.eventTypeCounts).length > 0 && (
                    <div className="mt-2">
                      <p className="font-semibold">Breakdown by type:</p>
                      <ul className="list-disc list-inside">
                        {Object.entries(event.eventTypeCounts).map(
                          ([type, count]) => (
                            <li key={type}>
                              {type}: {count}
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  )}

                  {event.recentEvents.length > 0 && (
                    <div className="mt-2">
                      <p className="font-semibold">Recent timestamps:</p>
                      <ul className="text-sm text-gray-600">
                        {event.recentEvents.map((trackedEvent) => {
                          const metadata = trackedEvent.metadata as Record<
                            string,
                            unknown
                          > | null;
                          const eventType = metadata?.eventType as
                            | string
                            | undefined;
                          return (
                            <li key={trackedEvent.id}>
                              {new Date(
                                trackedEvent.timestamp,
                              ).toLocaleString()}{" "}
                              - {eventType || "unknown"}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEditing(event)}
                      className="disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(event.id, event.name)}
                      disabled={deleteMutation.isPending}
                      className="disabled:opacity-50"
                    >
                      {deleteMutation.isPending ? "Deleting..." : "Delete"}
                    </button>
                  </div>

                  <div className="mt-4 p-4 bg-card border border-border">
                    <p className="font-semibold">Usage Examples:</p>
                    <p className="text-sm mt-2">
                      Simply add the data attribute - all interaction types
                      (click, view, hover) are tracked automatically!
                    </p>
                    <p className="text-sm mt-3 font-medium">
                      Data attribute (recommended):
                    </p>
                    <code className="block bg-background font-mono p-2 text-sm mt-1">
                      {`<button data-bklit-event="${event.trackingId}">Click Me</button>`}
                    </code>
                    <p className="text-sm mt-3 font-medium">ID attribute:</p>
                    <code className="block bg-background font-mono p-2 text-sm mt-1">
                      {`<button id="bklit-event-${event.trackingId}">Click Me</button>`}
                    </code>
                    <p className="text-sm mt-3 font-medium">
                      Manual tracking (JavaScript):
                    </p>
                    <code className="block bg-background font-mono p-2 text-sm mt-1">
                      {`window.trackEvent("${event.trackingId}", "custom_event");`}
                    </code>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
