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
import { Switch } from "@/components/ui/switch";
import { createExclusivePerk } from "@/lib/actions/exclusive-perk";

interface CreateExclusivePerkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateExclusivePerkDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateExclusivePerkDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isEnabled, setIsEnabled] = useState(true);

  const handleCreate = async () => {
    if (!name) {
      toast.error("Name is required");
      return;
    }

    try {
      setIsLoading(true);

      const result = await createExclusivePerk({
        name,
        description,
        isEnabled,
      });

      if (result.success) {
        toast.success("Exclusive perk created", {
          description: `"${name}" has been added to the exclusive perks list.`,
        });
        onSuccess?.();
        resetForm();
      } else {
        toast.error("Failed to create exclusive perk", {
          description:
            result.error ||
            "There was a problem creating this perk. Please try again.",
        });
      }
    } catch (error) {
      toast.error("Failed to create exclusive perk", {
        description:
          "An unexpected error occurred. Please try again or contact support if the problem persists.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setIsEnabled(true);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Exclusive Perk</DialogTitle>
          <DialogDescription>
            Create a new exclusive perk that will be available to events marked
            as exclusive.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="perk-name">Perk Name</Label>
            <Input
              id="perk-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VIP Access"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="perk-description">Description (optional)</Label>
            <Textarea
              id="perk-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this exclusive perk offers..."
              disabled={isLoading}
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="perk-enabled" className="cursor-pointer">
              Enable this perk
            </Label>
            <Switch
              id="perk-enabled"
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
              disabled={isLoading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isLoading || !name}>
            {isLoading ? "Creating..." : "Create Perk"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
