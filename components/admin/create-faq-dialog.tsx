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
import { createFAQ } from "@/lib/actions/faq";

interface CreateFAQDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateFAQDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateFAQDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [order, setOrder] = useState("");

  const handleCreate = async () => {
    if (!question.trim() || !answer.trim()) {
      toast.error("Please fill in all required fields", {
        description: "Question and answer are required.",
      });
      return;
    }

    try {
      setIsLoading(true);

      const result = await createFAQ({
        question: question.trim(),
        answer: answer.trim(),
        order: order ? parseInt(order) : undefined,
      });

      if (result.success) {
        toast.success("FAQ created successfully", {
          description:
            "The new FAQ has been added and is now visible on the contact page.",
        });

        // Reset form
        setQuestion("");
        setAnswer("");
        setOrder("");

        onSuccess?.();
        onOpenChange(false);
      } else {
        toast.error("Failed to create FAQ", {
          description:
            result.error ||
            "There was a problem creating the FAQ. Please try again.",
        });
      }
    } catch (error) {
      toast.error("Failed to create FAQ", {
        description:
          "An unexpected error occurred. Please try again or contact support if the problem persists.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setQuestion("");
      setAnswer("");
      setOrder("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New FAQ</DialogTitle>
          <DialogDescription>
            Add a new frequently asked question to help users find answers
            quickly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="question">
              Question <span className="text-red-500">*</span>
            </Label>
            <Input
              id="question"
              placeholder="What is your question?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="answer">
              Answer <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="answer"
              placeholder="Provide a detailed answer..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={isLoading}
              rows={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="order">Display Order (Optional)</Label>
            <Input
              id="order"
              type="number"
              placeholder="1, 2, 3..."
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              disabled={isLoading}
              min="1"
            />
            <p className="text-xs text-gray-500">
              Leave empty to add at the end. Lower numbers appear first.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isLoading}>
            {isLoading ? "Creating..." : "Create FAQ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
