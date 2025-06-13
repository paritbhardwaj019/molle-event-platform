"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { createCity } from "@/lib/actions/city";

interface CreateCityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateCityDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateCityDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    state: "",
  });

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.state.trim()) {
      toast.error("Please fill in all fields", {
        description: "Both city name and state are required.",
      });
      return;
    }

    try {
      setIsLoading(true);

      const result = await createCity({
        name: formData.name.trim(),
        state: formData.state.trim(),
      });

      if (result.success) {
        toast.success("City created successfully", {
          description: `${formData.name} in ${formData.state} has been added to the system.`,
        });
        setFormData({ name: "", state: "" });
        onSuccess?.();
        onOpenChange(false);
      } else {
        toast.error("Failed to create city", {
          description:
            result.error ||
            "There was a problem creating the city. Please try again.",
        });
      }
    } catch (error) {
      toast.error("Failed to create city", {
        description:
          "An unexpected error occurred. Please try again or contact support if the problem persists.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New City</DialogTitle>
          <DialogDescription>
            Add a new city to the platform for users to select from.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="city-name">City Name</Label>
            <Input
              id="city-name"
              placeholder="Enter city name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="state-name">State</Label>
            <Input
              id="state-name"
              placeholder="Enter state name"
              value={formData.state}
              onChange={(e) => handleInputChange("state", e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isLoading}>
            {isLoading ? "Creating..." : "Create City"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
