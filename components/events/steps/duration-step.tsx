"use client";

import { UseFormReturn } from "react-hook-form";
import { EventFormData } from "@/lib/validations/event";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DurationStepProps {
  form: UseFormReturn<EventFormData>;
}

export function DurationStep({ form }: DurationStepProps) {
  // Helper function to combine date and time
  const combineDateAndTime = (
    date: Date | undefined,
    timeString: string
  ): Date => {
    if (!date) return new Date();

    const [hours, minutes] = timeString.split(":").map(Number);
    const combined = new Date(date);
    combined.setHours(hours, minutes, 0, 0);
    return combined;
  };

  // Helper function to extract time from date
  const extractTime = (date: Date | undefined): string => {
    if (!date) return "09:00";
    return format(date, "HH:mm");
  };

  // Helper function to extract date from datetime
  const extractDate = (date: Date | undefined): Date | undefined => {
    return date
      ? new Date(date.getFullYear(), date.getMonth(), date.getDate())
      : undefined;
  };

  return (
    <div className="space-y-6">
      {/* Start Date and Time */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Event Start</h3>

        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Start Date</FormLabel>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "flex-1 pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick start date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={extractDate(field.value)}
                      onSelect={(date) => {
                        if (date) {
                          const currentTime = extractTime(field.value);
                          const newDateTime = combineDateAndTime(
                            date,
                            currentTime
                          );
                          field.onChange(newDateTime);

                          // Auto-set end date if not set
                          if (!form.getValues("endDate")) {
                            const endDateTime = new Date(newDateTime);
                            endDateTime.setHours(endDateTime.getHours() + 3);
                            form.setValue("endDate", endDateTime);
                          }
                        }
                      }}
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="time"
                    value={extractTime(field.value)}
                    onChange={(e) => {
                      const currentDate =
                        extractDate(field.value) || new Date();
                      const newDateTime = combineDateAndTime(
                        currentDate,
                        e.target.value
                      );
                      field.onChange(newDateTime);
                    }}
                    className="w-32"
                  />
                </div>
              </div>
              <FormDescription>
                Choose the date and time when your event will start
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* End Date and Time */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Event End</h3>

        <FormField
          control={form.control}
          name="endDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>End Date</FormLabel>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "flex-1 pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick end date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={extractDate(field.value)}
                      onSelect={(date) => {
                        if (date) {
                          const currentTime = extractTime(field.value);
                          const newDateTime = combineDateAndTime(
                            date,
                            currentTime
                          );
                          field.onChange(newDateTime);
                        }
                      }}
                      disabled={(date) => {
                        const startDate = form.getValues("startDate");
                        const startDateOnly = extractDate(startDate);
                        const today = new Date(new Date().setHours(0, 0, 0, 0));

                        if (date < today) return true;
                        if (startDateOnly && date < startDateOnly) return true;
                        return false;
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="time"
                    value={extractTime(field.value)}
                    onChange={(e) => {
                      const currentDate =
                        extractDate(field.value) || new Date();
                      const newDateTime = combineDateAndTime(
                        currentDate,
                        e.target.value
                      );
                      field.onChange(newDateTime);
                    }}
                    className="w-32"
                  />
                </div>
              </div>
              <FormDescription>
                Choose the date and time when your event will end
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Duration Preview */}
      {(() => {
        const startDate = form.getValues("startDate");
        const endDate = form.getValues("endDate");

        if (!startDate || !endDate) return null;

        return (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">Event Schedule</h4>
            <div className="space-y-1 text-sm text-blue-800">
              <p>
                <strong>Starts:</strong> {format(startDate, "PPPP 'at' p")}
              </p>
              <p>
                <strong>Ends:</strong> {format(endDate, "PPPP 'at' p")}
              </p>
              <p>
                <strong>Duration:</strong>{" "}
                {(() => {
                  const diffInHours =
                    Math.abs(endDate.getTime() - startDate.getTime()) /
                    (1000 * 60 * 60);
                  const hours = Math.floor(diffInHours);
                  const minutes = Math.round((diffInHours - hours) * 60);
                  return `${hours}h ${minutes}m`;
                })()}
              </p>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
