"use client";

import { UseFormReturn } from "react-hook-form";
import { EventFormData } from "@/lib/validations/event";
import { Plus, Trash2, X, HelpCircle, Minus } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMemo } from "react";

interface PackagesStepProps {
  form: UseFormReturn<EventFormData>;
}

export function PackagesStep({ form }: PackagesStepProps) {
  const packages = form.watch("packages") || [];
  const totalCapacity = form.watch("totalCapacity") || 0;

  // Calculate total allocation and remaining capacity - recalculates on every render
  const totalAllocated = packages.reduce(
    (sum, pkg) => sum + (Number(pkg.allocation) || 0),
    0
  );
  const remaining = totalCapacity - totalAllocated;
  const isOverCapacity = totalAllocated > totalCapacity && totalCapacity > 0;

  const allocationStats = {
    totalAllocated,
    remaining,
    isOverCapacity,
    percentage: totalCapacity > 0 ? (totalAllocated / totalCapacity) * 100 : 0,
  };

  const addPackage = () => {
    const currentPackages = form.getValues("packages") || [];
    const remainingCapacity = Math.max(1, allocationStats.remaining);

    form.setValue("packages", [
      ...currentPackages,
      {
        name: "",
        description: "",
        price: 0,
        maxTicketsPerBooking: 1,
        allocation: remainingCapacity,
        includedItems: [""],
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

  const addIncludedItem = (packageIndex: number) => {
    const currentPackages = form.getValues("packages") || [];
    const updatedPackages = [...currentPackages];
    updatedPackages[packageIndex] = {
      ...updatedPackages[packageIndex],
      includedItems: [
        ...(updatedPackages[packageIndex].includedItems || []),
        "",
      ],
    };
    form.setValue("packages", updatedPackages);
  };

  const removeIncludedItem = (packageIndex: number, itemIndex: number) => {
    const currentPackages = form.getValues("packages") || [];
    const updatedPackages = [...currentPackages];
    updatedPackages[packageIndex] = {
      ...updatedPackages[packageIndex],
      includedItems:
        updatedPackages[packageIndex].includedItems?.filter(
          (_, i) => i !== itemIndex
        ) || [],
    };
    form.setValue("packages", updatedPackages);
  };

  const updateIncludedItem = (
    packageIndex: number,
    itemIndex: number,
    value: string
  ) => {
    const currentPackages = form.getValues("packages") || [];
    const updatedPackages = [...currentPackages];
    const currentItems = [
      ...(updatedPackages[packageIndex].includedItems || []),
    ];
    currentItems[itemIndex] = value;
    updatedPackages[packageIndex] = {
      ...updatedPackages[packageIndex],
      includedItems: currentItems,
    };
    form.setValue("packages", updatedPackages);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Tickets</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          onClick={addPackage}
        >
          <Plus className="h-4 w-4" />
          Add Tickets
        </Button>
      </div>

      {/* Allocation Summary */}
      {totalCapacity > 0 && packages.length > 0 && (
        <Card
          className={`border-2 ${allocationStats.isOverCapacity ? "border-destructive" : "border-green-200"}`}
        >
          <CardContent className="pt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Capacity Distribution</h4>
                <div className="text-sm text-muted-foreground">
                  {allocationStats.totalAllocated} / {totalCapacity} tickets
                  allocated
                </div>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    allocationStats.isOverCapacity
                      ? "bg-destructive"
                      : "bg-green-500"
                  }`}
                  style={{
                    width: `${Math.min(allocationStats.percentage, 100)}%`,
                  }}
                />
              </div>

              <div className="flex justify-between text-sm">
                <span
                  className={
                    allocationStats.isOverCapacity
                      ? "text-destructive"
                      : "text-green-600"
                  }
                >
                  {allocationStats.percentage.toFixed(1)}% allocated
                </span>
                <span
                  className={
                    allocationStats.remaining < 0
                      ? "text-destructive"
                      : "text-muted-foreground"
                  }
                >
                  {allocationStats.remaining >= 0
                    ? `${allocationStats.remaining} remaining`
                    : `${Math.abs(allocationStats.remaining)} over capacity`}
                </span>
              </div>

              {allocationStats.isOverCapacity && (
                <Alert className="border-destructive">
                  <AlertDescription>
                    Total ticket allocation exceeds the event capacity. Please
                    adjust the allocations.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {packages.map((pkg, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-4">
                <h4 className="text-sm font-medium">Ticket {index + 1}</h4>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removePackage(index)}
                        disabled={packages.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    {packages.length <= 1 && (
                      <TooltipContent>
                        <p>At least one ticket is required</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="grid gap-4">
                <FormField
                  control={form.control}
                  name={`packages.${index}.name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ticket Name</FormLabel>
                      <FormControl>
                        <Input placeholder="VIP Ticket" {...field} />
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
                          placeholder="Describe what's included in this ticket"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
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
                    name={`packages.${index}.allocation`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          Ticket Allocation
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-3 w-3 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  Number of tickets available for this ticket
                                  type
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={totalCapacity}
                            placeholder="50"
                            value={field.value || ""}
                            onChange={(e) => {
                              const value = e.target.value
                                ? Number(e.target.value)
                                : undefined;
                              field.onChange(value);
                              // Force form to update by setting the value directly
                              form.setValue(
                                `packages.${index}.allocation`,
                                value,
                                {
                                  shouldValidate: true,
                                  shouldDirty: true,
                                  shouldTouch: true,
                                }
                              );
                            }}
                            className={
                              allocationStats.isOverCapacity
                                ? "border-destructive"
                                : ""
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
                        <FormLabel>Max Per Booking</FormLabel>
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

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <FormLabel>Included Items</FormLabel>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={() => addIncludedItem(index)}
                    >
                      <Plus className="h-3 w-3" />
                      Add Item
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {(pkg.includedItems || []).map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-center gap-2">
                        <Input
                          placeholder="Enter included item"
                          value={item}
                          onChange={(e) =>
                            updateIncludedItem(index, itemIndex, e.target.value)
                          }
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive p-2"
                          onClick={() => removeIncludedItem(index, itemIndex)}
                          disabled={(pkg.includedItems || []).length <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}

                    {(!pkg.includedItems || pkg.includedItems.length === 0) && (
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Enter included item"
                          value=""
                          onChange={(e) =>
                            updateIncludedItem(index, 0, e.target.value)
                          }
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive p-2"
                          disabled
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <FormDescription className="mt-2">
                    Add items that are included in this ticket
                  </FormDescription>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {packages.length === 0 && (
          <Alert className="border-destructive">
            <AlertDescription>
              <div className="text-center py-4">
                <div className="text-destructive font-medium mb-2">
                  At least one ticket is required
                </div>
                <div className="text-muted-foreground">
                  Click the "Add Tickets" button to add a ticket.
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
