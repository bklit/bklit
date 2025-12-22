"use client";

import { Button } from "@bklit/ui/components/button";
import {
  Dialog,
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
import {
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@bklit/ui/components/field";
import { Input } from "@bklit/ui/components/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@bklit/ui/components/sheet";
import { Skeleton } from "@bklit/ui/components/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@bklit/ui/components/tabs";
import { cn } from "@bklit/ui/lib/utils";
import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { Activity, Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useTRPC } from "@/trpc/react";
import type { StepData, StepType } from "./funnel-builder";

interface StepConfigSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: StepData) => void;
  onDelete?: () => void;
  onLiveUpdate?: (data: Partial<StepData>) => void;
  initialData?: StepData;
  projectId: string;
  organizationId: string;
}

const pageviewSchema = z.object({
  type: z.literal("pageview"),
  name: z.string().min(1, "Step name is required"),
  url: z.string().min(1, "URL is required"),
});

const eventSchema = z.object({
  type: z.literal("event"),
  eventName: z.string().min(1, "Event must be selected"),
});

const stepSchema = z.discriminatedUnion("type", [pageviewSchema, eventSchema]);

export function StepConfigSheet({
  open,
  onOpenChange,
  onSave,
  onDelete,
  onLiveUpdate,
  initialData,
  projectId,
  organizationId,
}: StepConfigSheetProps) {
  const [activeTab, setActiveTab] = useState<StepType>(
    initialData?.type || "pageview"
  );
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [copiedEvent, setCopiedEvent] = useState<string | null>(null);

  const trpc = useTRPC();

  // Fetch events from tRPC
  const { data: events, isLoading: eventsLoading } = useQuery(
    trpc.event.list.queryOptions({
      projectId,
      organizationId,
    })
  );

  const form = useForm({
    defaultValues: {
      type: (initialData?.type || "pageview") as StepType,
      name: initialData?.name || "",
      url: initialData?.url || "",
      eventName: initialData?.eventName || "",
    },
    validators: {
      onSubmit: stepSchema,
    },
    onSubmit: async ({ value }) => {
      if (value.type === "pageview") {
        onSave({
          type: "pageview",
          name: value.name.trim(),
          url: value.url.trim(),
        });
      } else {
        const selectedEvent = events?.find(
          (e) => e.trackingId === value.eventName
        );
        if (!selectedEvent) {
          form.setFieldMeta("eventName", (prev) => ({
            ...prev,
            errorMap: {
              onSubmit: ["Selected event not found"],
            },
          }));
          return;
        }
        onSave({
          type: "event",
          name: selectedEvent.name,
          eventName: selectedEvent.trackingId,
          eventCode: `analytics.track("${selectedEvent.trackingId}")`,
        });
      }
    },
  });

  // Reset form when sheet opens or initialData changes
  useEffect(() => {
    if (open) {
      const type = initialData?.type || "pageview";
      setActiveTab(type);
      form.setFieldValue("type", type);
      form.setFieldValue("name", initialData?.name || "");
      form.setFieldValue("url", initialData?.url || "");
      form.setFieldValue("eventName", initialData?.eventName || "");
    }
  }, [open, initialData, form]);

  // Live update when form values change
  useEffect(() => {
    const subscription = form.store.subscribe((state) => {
      const values = state.values;
      if (!(values && values.type)) return;

      if (values.type === "pageview") {
        onLiveUpdate?.({
          type: "pageview",
          name: values.name || "",
          url: values.url || "",
        });
      } else if (values.type === "event" && values.eventName) {
        const selectedEvent = events?.find(
          (e) => e.trackingId === values.eventName
        );
        if (selectedEvent) {
          onLiveUpdate?.({
            type: "event",
            name: selectedEvent.name,
            eventName: selectedEvent.trackingId,
          });
        }
      }
    });
    return () => subscription();
  }, [form, onLiveUpdate, events]);

  const handleTabChange = (value: StepType) => {
    setActiveTab(value);
    form.setFieldValue("type", value);
    if (value === "event" && form.state.values.eventName) {
      const selectedEvent = events?.find(
        (e) => e.trackingId === form.state.values.eventName
      );
      if (selectedEvent) {
        onLiveUpdate?.({
          type: "event",
          name: selectedEvent.name,
          eventName: selectedEvent.trackingId,
        });
      }
    } else {
      onLiveUpdate?.({
        type: "pageview",
        name: form.state.values.name,
        url: form.state.values.url,
      });
    }
  };

  const handleEventSelect = (eventName: string) => {
    form.setFieldValue("eventName", eventName);
    const selectedEvent = events?.find((e) => e.trackingId === eventName);
    if (selectedEvent) {
      onLiveUpdate?.({
        type: "event",
        name: selectedEvent.name,
        eventName: selectedEvent.trackingId,
      });
    }
  };

  const handleCopyCode = (eventName: string) => {
    navigator.clipboard.writeText(`analytics.track("${eventName}")`);
    setCopiedEvent(eventName);
    setTimeout(() => setCopiedEvent(null), 2000);
    toast.success("Code copied to clipboard");
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
      setOpenDeleteDialog(false);
      onOpenChange(false);
    }
  };

  const canSubmit = form.state.canSubmit;

  return (
    <>
      <Sheet onOpenChange={onOpenChange} open={open}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Configure Funnel Step</SheetTitle>
            <SheetDescription>
              Choose a step type and configure its properties.
            </SheetDescription>
          </SheetHeader>

          <form
            className="px-4"
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
          >
            <Tabs
              onValueChange={(v) => handleTabChange(v as StepType)}
              value={activeTab}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pageview">Pageview</TabsTrigger>
                <TabsTrigger value="event">Event</TabsTrigger>
              </TabsList>

              <TabsContent className="mt-6 space-y-4" value="pageview">
                <form.Field name="name">
                  {(field) => (
                    <FieldGroup>
                      <FieldLabel>Step Name</FieldLabel>
                      <Input
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="e.g., Homepage Visit"
                        value={field.state.value}
                      />
                      <FieldError>{field.state.meta.errors[0]}</FieldError>
                    </FieldGroup>
                  )}
                </form.Field>

                <form.Field name="url">
                  {(field) => (
                    <FieldGroup>
                      <FieldLabel>Page URL</FieldLabel>
                      <Input
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="e.g., / or /pricing"
                        value={field.state.value}
                      />
                      <FieldDescription>
                        Enter the full URL or a path pattern to match (e.g., "/"
                        for homepage)
                      </FieldDescription>
                      <FieldError>{field.state.meta.errors[0]}</FieldError>
                    </FieldGroup>
                  )}
                </form.Field>
              </TabsContent>

              <TabsContent className="mt-6" value="event">
                <div className="mb-4 space-y-2">
                  <FieldLabel>Select an Event</FieldLabel>
                  <FieldDescription>
                    Choose from your tracked events below
                  </FieldDescription>
                </div>

                {eventsLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }, (_, i) => (
                      <Skeleton className="h-16 w-full" key={i} />
                    ))}
                  </div>
                ) : !events || events.length === 0 ? (
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <Activity size={16} />
                      </EmptyMedia>
                      <EmptyTitle>No events found</EmptyTitle>
                    </EmptyHeader>
                    <EmptyContent>
                      <EmptyDescription>
                        You haven't created any events yet. Create an event to
                        use it in your funnel.
                      </EmptyDescription>
                    </EmptyContent>
                  </Empty>
                ) : (
                  <form.Field name="eventName">
                    {(field) => (
                      <>
                        <div className="grid max-h-[400px] gap-2 overflow-y-auto pr-1">
                          {events.map((event) => (
                            <button
                              className={cn(
                                "flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-all",
                                field.state.value === event.trackingId
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/50 hover:bg-secondary/50"
                              )}
                              key={event.id}
                              onClick={() => {
                                field.handleChange(event.trackingId);
                                handleEventSelect(event.trackingId);
                              }}
                              type="button"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-foreground text-sm">
                                  {event.name}
                                </p>
                                <code className="font-mono text-muted-foreground text-xs">
                                  {event.trackingId}
                                </code>
                              </div>
                              <Button
                                className="h-8 w-8 shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyCode(event.trackingId);
                                }}
                                size="icon"
                                type="button"
                                variant="ghost"
                              >
                                {copiedEvent === event.trackingId ? (
                                  <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </button>
                          ))}
                        </div>
                        <FieldError className="mt-2">
                          {field.state.meta.errors[0]}
                        </FieldError>
                      </>
                    )}
                  </form.Field>
                )}
              </TabsContent>
            </Tabs>
          </form>

          <SheetFooter>
            <div className="flex w-full justify-between">
              {onDelete && (
                <Button
                  onClick={() => setOpenDeleteDialog(true)}
                  type="button"
                  variant="destructive"
                >
                  Delete Step
                </Button>
              )}
              <Button
                disabled={!canSubmit}
                onClick={(e) => {
                  e.preventDefault();
                  form.handleSubmit();
                }}
                type="submit"
              >
                Save Step
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog onOpenChange={setOpenDeleteDialog} open={openDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Step</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete this
              step from the funnel.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setOpenDeleteDialog(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button onClick={handleDelete} type="button" variant="destructive">
              Delete Step
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
