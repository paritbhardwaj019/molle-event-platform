"use client";

import { useState } from "react";
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

interface AmenitiesStepProps {
  form: UseFormReturn<EventFormData>;
}

const DEFAULT_AMENITIES = [
  "WiFi",
  "Parking",
  "Food",
  "Drinks",
  "Security",
  "First Aid",
  "Restrooms",
  "Air Conditioning",
  "Wheelchair Access",
  "Seating",
];

export function AmenitiesStep({ form }: AmenitiesStepProps) {
  const amenities = form.watch("amenities") || [];
  const [customAmenity, setCustomAmenity] = useState("");

  const toggleAmenity = (amenity: string) => {
    const currentAmenities = form.getValues("amenities") || [];
    const newAmenities = currentAmenities.includes(amenity)
      ? currentAmenities.filter((a) => a !== amenity)
      : [...currentAmenities, amenity];
    form.setValue("amenities", newAmenities);
  };

  const addCustomAmenity = () => {
    if (!customAmenity.trim()) return;
    const currentAmenities = form.getValues("amenities") || [];
    if (!currentAmenities.includes(customAmenity)) {
      form.setValue("amenities", [...currentAmenities, customAmenity.trim()]);
    }
    setCustomAmenity("");
  };

  const removeAmenity = (amenity: string) => {
    const currentAmenities = form.getValues("amenities") || [];
    form.setValue(
      "amenities",
      currentAmenities.filter((a) => a !== amenity)
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Standard Amenities</h3>
        <div className="grid grid-cols-2 gap-4">
          {DEFAULT_AMENITIES.map((amenity) => (
            <div key={amenity} className="flex items-center space-x-2">
              <Checkbox
                id={amenity}
                checked={amenities.includes(amenity)}
                onCheckedChange={() => toggleAmenity(amenity)}
              />
              <label
                htmlFor={amenity}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {amenity}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Custom Amenities</h3>
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

        <div className="flex flex-wrap gap-2">
          {amenities
            .filter((amenity) => !DEFAULT_AMENITIES.includes(amenity))
            .map((amenity) => (
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
      </div>

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
