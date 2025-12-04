"use client";

import { Button } from "@bklit/ui/components/button";
import { Input } from "@bklit/ui/components/input";
import { Label } from "@bklit/ui/components/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@bklit/ui/components/sheet";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@bklit/ui/components/tabs";
import { cn } from "@bklit/ui/lib/utils";
import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import type { StepData, StepType } from "./funnel-builder";

interface StepConfigSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: StepData) => void;
  onDelete?: () => void;
  onLiveUpdate?: (data: Partial<StepData>) => void;
  initialData?: StepData;
}

const sampleEvents = [
  { name: "Sign Up", eventName: "user_signup" },
  { name: "Login", eventName: "user_login" },
  { name: "Add to Cart", eventName: "add_to_cart" },
  { name: "Checkout Started", eventName: "checkout_started" },
  { name: "Purchase Complete", eventName: "purchase_complete" },
  { name: "Newsletter Subscribe", eventName: "newsletter_subscribe" },
  { name: "Download App", eventName: "download_app" },
  { name: "Share Content", eventName: "share_content" },
  { name: "Video Play", eventName: "video_play" },
];

export function StepConfigSheet({
  open,
  onOpenChange,
  onSave,
  onDelete,
  onLiveUpdate,
  initialData,
}: StepConfigSheetProps) {
  const [activeTab, setActiveTab] = useState<StepType>(
    initialData?.type || "pageview",
  );
  const [name, setName] = useState(initialData?.name || "");
  const [url, setUrl] = useState(initialData?.url || "");
  const [selectedEvent, setSelectedEvent] = useState<string | null>(
    initialData?.eventName || null,
  );
  const [copiedEvent, setCopiedEvent] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setActiveTab(initialData?.type || "pageview");
      setName(initialData?.name || "");
      setUrl(initialData?.url || "");
      setSelectedEvent(initialData?.eventName || null);
    }
  }, [open, initialData]);

  const handleNameChange = (value: string) => {
    setName(value);
    onLiveUpdate?.({ type: activeTab, name: value, url });
  };

  const handleUrlChange = (value: string) => {
    setUrl(value);
    onLiveUpdate?.({ type: activeTab, name, url: value });
  };

  const handleTabChange = (value: StepType) => {
    setActiveTab(value);
    if (value === "event" && selectedEvent) {
      const event = sampleEvents.find((e) => e.eventName === selectedEvent);
      onLiveUpdate?.({
        type: value,
        name: event?.name || "",
        eventName: selectedEvent,
      });
    } else {
      onLiveUpdate?.({ type: value, name, url });
    }
  };

  const handleEventSelect = (eventName: string) => {
    setSelectedEvent(eventName);
    const event = sampleEvents.find((e) => e.eventName === eventName);
    if (event) {
      onLiveUpdate?.({
        type: "event",
        name: event.name,
        eventName: event.eventName,
      });
    }
  };

  const handleSave = () => {
    if (activeTab === "pageview") {
      if (!name.trim() || !url.trim()) return;
      onSave({ type: "pageview", name: name.trim(), url: url.trim() });
    } else {
      const event = sampleEvents.find((e) => e.eventName === selectedEvent);
      if (!event) return;
      onSave({
        type: "event",
        name: event.name,
        eventName: event.eventName,
        eventCode: `analytics.track("${event.eventName}")`,
      });
    }
  };

  const handleCopyCode = (eventName: string) => {
    navigator.clipboard.writeText(`analytics.track("${eventName}")`);
    setCopiedEvent(eventName);
    setTimeout(() => setCopiedEvent(null), 2000);
  };

  const isValid =
    activeTab === "pageview"
      ? name.trim() && url.trim()
      : selectedEvent !== null;

  return (
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
              <div className="space-y-2">
                <Label htmlFor="step-name">Step Name</Label>
                <Input
                  id="step-name"
                  placeholder="e.g., Homepage Visit"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="page-url">Page URL</Label>
                <Input
                  id="page-url"
                  placeholder="e.g., /pricing or https://example.com/pricing"
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter the full URL or a path pattern to match
                </p>
              </div>
            </TabsContent>

            <TabsContent value="event" className="mt-6">
              <div className="space-y-2 mb-4">
                <Label>Select an Event</Label>
                <p className="text-xs text-muted-foreground">
                  Choose from your tracked events below
                </p>
              </div>

              <div className="grid gap-2 max-h-[400px] overflow-y-auto pr-1">
                {sampleEvents.map((event) => (
                  <button
                    type="button"
                    key={event.eventName}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all",
                      selectedEvent === event.eventName
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-secondary/50",
                    )}
                    onClick={() => handleEventSelect(event.eventName)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground">
                        {event.name}
                      </p>
                      <code className="text-xs text-muted-foreground font-mono">
                        {event.eventName}
                      </code>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyCode(event.eventName);
                      }}
                    >
                      {copiedEvent === event.eventName ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </button>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
        <SheetFooter>
          <div className="flex justify-between w-full">
            {onDelete && (
              <Button
                variant="destructive"
                onClick={() => {
                  onDelete();
                  onOpenChange(false);
                }}
              >
                Delete Step
              </Button>
            )}
            <Button onClick={handleSave} disabled={!isValid}>
              Save Step
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
