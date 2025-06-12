"use client";

import { UseFormReturn } from "react-hook-form";
import { EventFormData } from "@/lib/validations/event";
import { Plus, Trash2, X, HelpCircle } from "lucide-react";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PackagesStepProps {
  form: UseFormReturn<EventFormData>;
}

export function PackagesStep({ form }: PackagesStepProps) {
  const packages = form.watch("packages") || [];

  const addPackage = () => {
    const currentPackages = form.getValues("packages") || [];
    form.setValue("packages", [
      ...currentPackages,
      {
        name: "",
        description: "",
        price: 0,
        maxTicketsPerBooking: 1,
        includedItems: [],
      },
    ]);
  };

  const removePackage = (index: number) => {
    const currentPackages = form.getValues("packages") || [];
    form.setValue(
      "packages",
      currentPackages.filter((_, i) => i !== index)
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Packages</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          onClick={addPackage}
        >
          <Plus className="h-4 w-4" />
          Add Package
        </Button>
      </div>

      <div className="space-y-4">
        {packages.map((_, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-4">
                <h4 className="text-sm font-medium">Package {index + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => removePackage(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid gap-4">
                <FormField
                  control={form.control}
                  name={`packages.${index}.name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Package Name</FormLabel>
                      <FormControl>
                        <Input placeholder="VIP Package" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`packages.${index}.description`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe what's included in this package"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`packages.${index}.price`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            step={0.01}
                            placeholder="99.99"
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`packages.${index}.maxTicketsPerBooking`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Tickets Per Booking</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            placeholder="10"
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name={`packages.${index}.includedItems`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Included Items</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="One item per line"
                          {...field}
                          value={field.value?.join("\n")}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                .split("\n")
                                .map((item) => item.trim())
                                .filter(Boolean)
                            )
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Enter each included item on a new line
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        ))}

        {packages.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No packages added. Click the "Add Package" button to add a package.
          </div>
        )}
      </div>
    </div>
  );
}
