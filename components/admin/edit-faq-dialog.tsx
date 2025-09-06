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
import { updateFAQ } from "@/lib/actions/faq";
import type { FAQ } from "@/lib/actions/faq";

interface EditFAQDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  faq: FAQ | null;
}

export function EditFAQDialog({
  open,
  onOpenChange,
  onSuccess,
  faq,
}: EditFAQDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [order, setOrder] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Reset form when FAQ changes or dialog opens
  useEffect(() => {
    if (faq && open) {
      setQuestion(faq.question);
      setAnswer(faq.answer);
      setOrder(faq.order.toString());
      setIsActive(faq.isActive);
    }
  }, [faq, open]);

  const handleUpdate = async () => {
    if (!faq) return;

    if (!question.trim() || !answer.trim()) {
      toast.error("Please fill in all required fields", {
        description: "Question and answer are required.",
      });
      return;
    }

    const orderNumber = parseInt(order);
    if (isNaN(orderNumber) || orderNumber < 1) {
      toast.error("Invalid order number", {
        description: "Order must be a positive number.",
      });
      return;
    }

    try {
      setIsLoading(true);

      const result = await updateFAQ({
        id: faq.id,
        question: question.trim(),
        answer: answer.trim(),
        order: orderNumber,
        isActive,
      });

      if (result.success) {
        toast.success("FAQ updated successfully", {
          description: "The FAQ has been updated.",
        });

        onSuccess?.();
        onOpenChange(false);
      } else {
        toast.error("Failed to update FAQ", {
          description:
            result.error ||
            "There was a problem updating the FAQ. Please try again.",
        });
      }
    } catch (error) {
      toast.error("Failed to update FAQ", {
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit FAQ</DialogTitle>
          <DialogDescription>
            Update the frequently asked question and its answer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-question">
              Question <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-question"
              placeholder="What is your question?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-answer">
              Answer <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="edit-answer"
              placeholder="Provide a detailed answer..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={isLoading}
              rows={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-order">
              Display Order <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-order"
              type="number"
              placeholder="1, 2, 3..."
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              disabled={isLoading}
              min="1"
            />
            <p className="text-xs text-gray-500">
              Lower numbers appear first on the contact page.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="edit-active"
              checked={isActive}
              onCheckedChange={setIsActive}
              disabled={isLoading}
            />
            <Label htmlFor="edit-active">Show on contact page</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={isLoading}>
            {isLoading ? "Updating..." : "Update FAQ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
