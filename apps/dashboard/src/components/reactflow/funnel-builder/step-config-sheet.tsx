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
    initialData?.type || "pageview",
  );
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [copiedEvent, setCopiedEvent] = useState<string | null>(null);

  const trpc = useTRPC();

  // Fetch events from tRPC
  const { data: events, isLoading: eventsLoading } = useQuery(
    trpc.event.list.queryOptions({
      projectId,
      organizationId,
    }),
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
          (e) => e.trackingId === value.eventName,
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
      if (!values || !values.type) return;

      if (values.type === "pageview") {
        onLiveUpdate?.({
          type: "pageview",
          name: values.name || "",
          url: values.url || "",
        });
      } else if (values.type === "event" && values.eventName) {
        const selectedEvent = events?.find(
          (e) => e.trackingId === values.eventName,
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
    if (value === "event") {
      if (form.state.values.eventName) {
        const selectedEvent = events?.find(
          (e) => e.trackingId === form.state.values.eventName,
        );
        if (selectedEvent) {
          onLiveUpdate?.({
            type: "event",
            name: selectedEvent.name,
            eventName: selectedEvent.trackingId,
          });
        }
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
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Configure Funnel Step</SheetTitle>
            <SheetDescription>
              Choose a step type and configure its properties.
            </SheetDescription>
          </SheetHeader>

          <div className="px-4">
            <Tabs
              value={activeTab}
              onValueChange={(v) => handleTabChange(v as StepType)}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pageview">Pageview</TabsTrigger>
                <TabsTrigger value="event">Event</TabsTrigger>
              </TabsList>

              <TabsContent value="pageview" className="mt-6 space-y-4">
                <form.Field name="name">
                  {(field) => (
                    <FieldGroup>
                      <FieldLabel>Step Name</FieldLabel>
                      <Input
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="e.g., Homepage Visit"
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
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="e.g., / or /pricing"
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

              <TabsContent value="event" className="mt-6">
                <div className="space-y-2 mb-4">
                  <FieldLabel>Select an Event</FieldLabel>
                  <FieldDescription>
                    Choose from your tracked events below
                  </FieldDescription>
                </div>

                {eventsLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }, (_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
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
                        <div className="grid gap-2 max-h-[370px] overflow-y-auto pr-1">
                          {events.map((event) => (
                            // biome-ignore lint/a11y/useSemanticElements: Using div with role="button" to avoid nested buttons (copy button inside)
                            <div
                              role="button"
                              tabIndex={0}
                              key={event.id}
                              className={cn(
                                "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all",
                                field.state.value === event.trackingId
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/50 hover:bg-secondary/50",
                              )}
                              onClick={() => {
                                field.handleChange(event.trackingId);
                                handleEventSelect(event.trackingId);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  field.handleChange(event.trackingId);
                                  handleEventSelect(event.trackingId);
                                }
                              }}
                            >
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-foreground">
                                  {event.name}
                                </p>
                                <code className="text-xs text-muted-foreground font-mono">
                                  {event.trackingId}
                                </code>
                              </div>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyCode(event.trackingId);
                                }}
                              >
                                {copiedEvent === event.trackingId ? (
                                  <Check className="w-4 h-4 text-green-500" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
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
          </div>

          <SheetFooter>
            <div className="flex justify-between w-full">
              {onDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setOpenDeleteDialog(true)}
                >
                  Delete Step
                </Button>
              )}
              <Button
                type="submit"
                onClick={(e) => {
                  e.preventDefault();
                  form.handleSubmit();
                }}
                disabled={!canSubmit}
              >
                Save Step
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
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
              type="button"
              variant="outline"
              onClick={() => setOpenDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete}>
              Delete Step
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
