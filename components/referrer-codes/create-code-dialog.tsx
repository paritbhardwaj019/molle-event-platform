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
import { createReferrerCode } from "@/lib/actions/referrer-code";

interface CreateCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateCodeDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateCodeDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [description, setDescription] = useState("");

  const handleCreate = async () => {
    try {
      setIsLoading(true);

      const result = await createReferrerCode({
        description: description.trim() || null,
      });

      if (result.success) {
        toast.success("Referrer code created", {
          description:
            "You can now share this code with potential referrers who want to join your team.",
        });
        onSuccess?.();
        onOpenChange(false);
        setDescription("");
      } else {
        toast.error("Failed to create referrer code", {
          description:
            result.error ||
            "There was a problem creating your referrer code. Please try again.",
        });
      }
    } catch (error) {
      toast.error("Failed to create referrer code", {
        description:
          "An unexpected error occurred. Please try again or contact support if the problem persists.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) setDescription("");
        onOpenChange(isOpen);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Referrer Code</DialogTitle>
          <DialogDescription>
            Create a new referrer code to share with potential referrers who
            want to join your team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              placeholder="e.g. Instagram campaign, Friends and family, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <p className="text-sm text-gray-500">
              Add a description to help you remember the purpose of this
              referrer code.
            </p>
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
            Create Code
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
