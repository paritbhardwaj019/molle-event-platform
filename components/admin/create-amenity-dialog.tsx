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
import { Textarea } from "@/components/ui/textarea";
import { createAmenity } from "@/lib/actions/amenity";

interface CreateAmenityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateAmenityDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateAmenityDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Please fill in all required fields", {
        description: "Amenity name is required.",
      });
      return;
    }

    try {
      setIsLoading(true);

      const result = await createAmenity({
        name: name.trim(),
        description: description.trim() || undefined,
        isEnabled: true,
      });

      if (result.success) {
        toast.success("Amenity created successfully", {
          description:
            "The new amenity has been added and is now available to hosts.",
        });

        // Reset form
        setName("");
        setDescription("");

        onSuccess?.();
        onOpenChange(false);
      } else {
        toast.error("Failed to create amenity", {
          description:
            result.error ||
            "There was a problem creating the amenity. Please try again.",
        });
      }
    } catch (error) {
      toast.error("Failed to create amenity", {
        description:
          "An unexpected error occurred. Please try again or contact support if the problem persists.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setName("");
      setDescription("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Amenity</DialogTitle>
          <DialogDescription>
            Create a new amenity that hosts can add to their events.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g., WiFi, Parking, Air Conditioning"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              maxLength={50}
            />
            <p className="text-xs text-gray-500">Maximum 50 characters</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the amenity..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Amenity"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
