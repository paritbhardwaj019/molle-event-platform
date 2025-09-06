"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateHostFeePercentage } from "@/lib/actions/host";
import type { Host } from "@/lib/actions/host";

interface UpdateHostFeeDialogProps {
  host: Host | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function UpdateHostFeeDialog({
  host,
  open,
  onOpenChange,
  onSuccess,
}: UpdateHostFeeDialogProps) {
  const [feePercentage, setFeePercentage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when host changes
  React.useEffect(() => {
    if (host) {
      setFeePercentage(host.hostFeePercentage?.toString() || "");
    }
  }, [host]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!host) return;

    setIsLoading(true);

    try {
      // Convert empty string to null, otherwise parse as number
      const percentage =
        feePercentage.trim() === "" ? null : parseFloat(feePercentage);

      // Validate percentage if provided
      if (
        percentage !== null &&
        (isNaN(percentage) || percentage < 0 || percentage > 100)
      ) {
        toast.error("Invalid percentage", {
          description:
            "Fee percentage must be between 0 and 100, or empty to use platform default",
        });
        setIsLoading(false);
        return;
      }

      const result = await updateHostFeePercentage(host.id, percentage);

      if (result.success) {
        toast.success("Host fee updated successfully", {
          description: `${host.name}'s fee percentage has been updated.`,
        });
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error("Failed to update host fee", {
          description:
            result.error || "An error occurred while updating the fee",
        });
      }
    } catch (error) {
      toast.error("Failed to update host fee", {
        description: "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onOpenChange(false);
      setFeePercentage("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Host Fee Percentage</DialogTitle>
          <DialogDescription>
            Set a custom fee percentage for {host?.name}. Leave empty to use the
            platform default fee.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="feePercentage" className="text-right">
                Fee %
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Input
                  id="feePercentage"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={feePercentage}
                  onChange={(e) => setFeePercentage(e.target.value)}
                  placeholder="e.g., 6.5 or leave empty"
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <div></div>
              <div className="col-span-3 text-sm text-muted-foreground">
                <p>• Empty: Use platform default ({6}%)</p>
                <p>• Custom: Set specific percentage for this host</p>
                <p>• Example: 10% means host pays 10% from ticket price</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Fee"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
