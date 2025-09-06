"use client";

import { useState, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import { updateAmenity } from "@/lib/actions/amenity";
import type { Amenity } from "@/lib/actions/amenity";

interface EditAmenityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amenity: Amenity | null;
  onSuccess?: () => void;
}

export function EditAmenityDialog({
  open,
  onOpenChange,
  amenity,
  onSuccess,
}: EditAmenityDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isEnabled, setIsEnabled] = useState(true);

  // Reset form when amenity changes
  useEffect(() => {
    if (amenity) {
      setName(amenity.name);
      setDescription(amenity.description || "");
      setIsEnabled(amenity.isEnabled);
    } else {
      setName("");
      setDescription("");
      setIsEnabled(true);
    }
  }, [amenity]);

  const handleUpdate = async () => {
    if (!amenity) return;

    if (!name.trim()) {
      toast.error("Please fill in all required fields", {
        description: "Amenity name is required.",
      });
      return;
    }

    try {
      setIsLoading(true);

      const result = await updateAmenity({
        id: amenity.id,
        name: name.trim(),
        description: description.trim() || undefined,
        isEnabled,
      });

      if (result.success) {
        toast.success("Amenity updated successfully", {
          description: "The amenity has been updated.",
        });

        onSuccess?.();
        onOpenChange(false);
      } else {
        toast.error("Failed to update amenity", {
          description:
            result.error ||
            "There was a problem updating the amenity. Please try again.",
        });
      }
    } catch (error) {
      toast.error("Failed to update amenity", {
        description:
          "An unexpected error occurred. Please try again or contact support if the problem persists.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Amenity</DialogTitle>
          <DialogDescription>Update the amenity details.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-name"
              placeholder="e.g., WiFi, Parking, Air Conditioning"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              maxLength={50}
            />
            <p className="text-xs text-gray-500">Maximum 50 characters</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description (Optional)</Label>
            <Textarea
              id="edit-description"
              placeholder="Brief description of the amenity..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="edit-enabled"
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
              disabled={isLoading}
            />
            <Label htmlFor="edit-enabled">Enable this amenity for hosts</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={isLoading}>
            {isLoading ? "Updating..." : "Update Amenity"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
