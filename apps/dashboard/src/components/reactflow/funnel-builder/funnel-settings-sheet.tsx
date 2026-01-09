"use client";

import { Button } from "@bklit/ui/components/button";
import { Calendar as CalendarComponent } from "@bklit/ui/components/calendar";
import {
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@bklit/ui/components/field";
import { Input } from "@bklit/ui/components/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@bklit/ui/components/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@bklit/ui/components/sheet";
import { Switch } from "@bklit/ui/components/switch";
import { useForm } from "@tanstack/react-form";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";

const funnelSchema = z.object({
  name: z.string().min(1, "Funnel name is required"),
  hasExpirationDate: z.boolean(),
  endDate: z.date().optional(),
});

interface FunnelSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { name: string; endDate?: Date | null }) => void;
  initialName?: string;
  initialEndDate?: Date | null;
  showNameError?: boolean;
}

export function FunnelSettingsSheet({
  open,
  onOpenChange,
  onSave,
  initialName = "",
  initialEndDate,
  showNameError = false,
}: FunnelSettingsSheetProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    initialEndDate ? new Date(initialEndDate) : undefined
  );

  const form = useForm({
    defaultValues: {
      name: initialName,
      hasExpirationDate: !!initialEndDate,
      endDate: initialEndDate ? new Date(initialEndDate) : undefined,
    },
    validators: {
      onSubmit: ({ value }) => {
        const result = funnelSchema.safeParse({
          name: value.name,
          hasExpirationDate: value.hasExpirationDate,
          endDate: value.hasExpirationDate ? value.endDate : undefined,
        });
        if (!result.success) {
          return result.error.format();
        }
        return undefined;
      },
    },
    onSubmit: ({ value }) => {
      onSave({
        name: value.name.trim(),
        endDate: value.hasExpirationDate ? selectedDate || null : null,
      });
      onOpenChange(false);
    },
  });

  // Set name error if showNameError is true
  useEffect(() => {
    if (showNameError && open) {
      form.setFieldMeta("name", (prev) => ({
        ...prev,
        errorMap: {
          onSubmit: ["Funnel name is required"],
        },
      }));
    }
  }, [showNameError, open, form]);

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Funnel Settings</SheetTitle>
          <SheetDescription>
            Configure your funnel name and optional expiration date.
          </SheetDescription>
        </SheetHeader>

        <form
          className="flex flex-1 flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <div className="space-y-6 px-4">
            <form.Field name="name">
              {(field) => (
                <FieldGroup>
                  <FieldLabel>Funnel Name</FieldLabel>
                  <Input
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="e.g., Sign Up Funnel"
                    value={field.state.value}
                  />
                  <FieldError>{field.state.meta.errors[0]}</FieldError>
                </FieldGroup>
              )}
            </form.Field>

            <form.Field name="hasExpirationDate">
              {(field) => (
                <>
                  <FieldGroup>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <FieldLabel>Set Expiration Date</FieldLabel>
                        <FieldDescription>
                          Optionally set an expiration date for this funnel
                        </FieldDescription>
                      </div>
                      <Switch
                        checked={field.state.value}
                        onCheckedChange={(checked) => {
                          field.handleChange(checked);
                          if (!checked) {
                            setSelectedDate(undefined);
                            form.setFieldValue("endDate", undefined);
                          }
                        }}
                      />
                    </div>
                  </FieldGroup>

                  {field.state.value && ( // Conditionally render endDate field, inside same scope
                    <form.Field name="endDate">
                      {(endDateField) => (
                        <FieldGroup>
                          <FieldLabel>Expiration Date</FieldLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                className="w-full justify-start text-left font-normal"
                                type="button"
                                variant="outline"
                              >
                                <CalendarIcon className="mr-2 size-4" />
                                {selectedDate ? (
                                  format(selectedDate, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              align="start"
                              className="w-auto p-0"
                            >
                              <CalendarComponent
                                initialFocus
                                mode="single"
                                onSelect={(date) => {
                                  setSelectedDate(date);
                                  endDateField.handleChange(date);
                                }}
                                selected={selectedDate}
                              />
                            </PopoverContent>
                          </Popover>
                          <FieldError>
                            {endDateField.state.meta.errors[0]}
                          </FieldError>
                        </FieldGroup>
                      )}
                    </form.Field>
                  )}
                </>
              )}
            </form.Field>
          </div>

          <SheetFooter>
            <Button
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={!form.state.isValid}
              type="submit"
              variant="secondary"
            >
              Update
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
