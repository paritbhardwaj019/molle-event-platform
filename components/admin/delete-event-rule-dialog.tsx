"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteEventRule, EventRule } from "@/lib/actions/event-rule";

interface DeleteEventRuleDialogProps {
  rule: EventRule;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteEventRuleDialog({
  rule,
  open,
  onOpenChange,
}: DeleteEventRuleDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const result = await deleteEventRule(rule.id);
      if (result.success) {
        toast.success("Event rule deleted successfully");
        onOpenChange(false);
      } else {
        toast.error(result.error || "Failed to delete event rule");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Event Rule</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the rule "{rule.title}"? This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
