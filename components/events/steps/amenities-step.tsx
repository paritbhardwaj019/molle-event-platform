"use client";

import { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { EventFormData } from "@/lib/validations/event";
import { Plus, X } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { getEnabledAmenities } from "@/lib/actions/amenity";
import type { Amenity } from "@/lib/actions/amenity";

interface AmenitiesStepProps {
  form: UseFormReturn<EventFormData>;
}

export function AmenitiesStep({ form }: AmenitiesStepProps) {
  const amenities = form.watch("amenities") || [];
  const [customAmenity, setCustomAmenity] = useState("");
  const [availableAmenities, setAvailableAmenities] = useState<Amenity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Fetch available amenities from the database
  useEffect(() => {
    const fetchAmenities = async () => {
      try {
        const result = await getEnabledAmenities();
        if (result.success && result.data) {
          setAvailableAmenities(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch amenities:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAmenities();
  }, []);

  const toggleAmenity = (amenityName: string) => {
    const currentAmenities = form.getValues("amenities") || [];
    const newAmenities = currentAmenities.includes(amenityName)
      ? currentAmenities.filter((a) => a !== amenityName)
      : [...currentAmenities, amenityName];
    form.setValue("amenities", newAmenities);
  };

  const addCustomAmenity = () => {
    if (!customAmenity.trim()) return;
    const currentAmenities = form.getValues("amenities") || [];
    if (!currentAmenities.includes(customAmenity)) {
      form.setValue("amenities", [...currentAmenities, customAmenity.trim()]);
    }
    setCustomAmenity("");
    // Keep the input visible after adding an amenity
    setShowCustomInput(true);
  };

  const removeAmenity = (amenity: string) => {
    const currentAmenities = form.getValues("amenities") || [];
    const newAmenities = currentAmenities.filter((a) => a !== amenity);
    form.setValue("amenities", newAmenities);

    // Hide custom input if no custom amenities left and input is empty
    const availableAmenityNames = availableAmenities.map((a) => a.name);
    const remainingCustomAmenities = newAmenities.filter(
      (amenity) => !availableAmenityNames.includes(amenity)
    );
    if (remainingCustomAmenities.length === 0 && !customAmenity.trim()) {
      setShowCustomInput(false);
    }
  };

  const availableAmenityNames = availableAmenities.map((a) => a.name);
  const customAmenities = amenities.filter(
    (amenity) => !availableAmenityNames.includes(amenity)
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-4">Loading amenities...</h3>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="h-4 w-4 bg-gray-200 animate-pulse rounded" />
                <div className="h-4 w-24 bg-gray-200 animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Select Amenities</h3>
        {availableAmenities.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No amenities available. Contact admin to add amenities.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {availableAmenities.map((amenity) => (
              <div key={amenity.id} className="flex items-center space-x-2">
                <Checkbox
                  id={amenity.id}
                  checked={amenities.includes(amenity.name)}
                  onCheckedChange={() => toggleAmenity(amenity.name)}
                />
                <label
                  htmlFor={amenity.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {amenity.name}
                  {amenity.description && (
                    <span className="block text-xs text-gray-500 font-normal">
                      {amenity.description}
                    </span>
                  )}
                </label>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Custom Amenities Section - Only show if there are custom amenities or user wants to add */}
      {(customAmenities.length > 0 || showCustomInput) && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Custom Amenities</h3>

          {customAmenities.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {customAmenities.map((amenity) => (
                <Badge
                  key={amenity}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {amenity}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => removeAmenity(amenity)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Input
              placeholder="Add custom amenity..."
              value={customAmenity}
              onChange={(e) => setCustomAmenity(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomAmenity();
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={addCustomAmenity}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <FormDescription>
            Press Enter or click the plus button to add a custom amenity
          </FormDescription>
        </div>
      )}

      {/* Add Custom Amenity Button - Only show if no custom amenities and not showing input */}
      {customAmenities.length === 0 && !showCustomInput && (
        <div className="border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowCustomInput(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Custom Amenity
          </Button>
          <p className="text-xs text-gray-500 mt-2">
            Can't find what you're looking for? Add a custom amenity.
          </p>
        </div>
      )}

      <FormField
        control={form.control}
        name="amenities"
        render={() => (
          <FormItem>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
