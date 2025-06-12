"use client";

import { UseFormReturn } from "react-hook-form";
import { EventFormData } from "@/lib/validations/event";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface CapacityStepProps {
  form: UseFormReturn<EventFormData>;
}

export function CapacityStep({ form }: CapacityStepProps) {
  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="totalCapacity"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Total Capacity</FormLabel>
            <FormControl>
              <Input
                type="number"
                min={1}
                placeholder="1000"
                {...field}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            </FormControl>
            <FormDescription>
              Maximum number of attendees for the event
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="maxTicketsPerUser"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Maximum Tickets per User</FormLabel>
            <FormControl>
              <Input
                type="number"
                min={1}
                placeholder="4"
                {...field}
                onChange={(e) =>
                  field.onChange(
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
              />
            </FormControl>
            <FormDescription>Leave empty for no limit per user</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Age Restrictions</h3>

        <FormField
          control={form.control}
          name="ageLimits.min"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Minimum Age</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  placeholder="18"
                  {...field}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                />
              </FormControl>
              <FormDescription>
                Leave empty if no minimum age requirement
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ageLimits.max"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Maximum Age</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  placeholder="65"
                  {...field}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                />
              </FormControl>
              <FormDescription>
                Leave empty if no maximum age limit
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ageLimits.note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Age Restriction Note</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional information about age restrictions..."
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Optional note about age restrictions (e.g., "Under 16 must be
                accompanied by an adult")
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
