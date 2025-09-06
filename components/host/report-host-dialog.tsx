"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { reportHost } from "@/lib/actions/host";

interface ReportHostDialogProps {
  hostId: string;
  hostName: string;
  children: React.ReactNode;
}

const REPORT_REASONS = [
  { value: "inappropriate_behavior", label: "Inappropriate Behavior" },
  { value: "fake_events", label: "Fake or Misleading Events" },
  { value: "poor_service", label: "Poor Service Quality" },
  { value: "safety_concerns", label: "Safety Concerns" },
  { value: "spam", label: "Spam or Promotional Abuse" },
  { value: "fraud", label: "Fraudulent Activity" },
  { value: "other", label: "Other" },
];

export function ReportHostDialog({
  hostId,
  hostName,
  children,
}: ReportHostDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    reason: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.reason) {
      toast.error("Please select a reason for reporting");
      return;
    }

    setIsSubmitting(true);

    try {
      const reasonLabel =
        REPORT_REASONS.find((r) => r.value === formData.reason)?.label ||
        formData.reason;

      const result = await reportHost({
        hostId,
        reason: reasonLabel,
        description: formData.description.trim() || undefined,
      });

      if (result.success) {
        toast.success("Report submitted successfully", {
          description: "Thank you for your report. We'll review it shortly.",
        });
        setOpen(false);
        setFormData({ reason: "", description: "" });
      } else {
        toast.error("Failed to submit report", {
          description: result.error || "Please try again",
        });
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      toast.error("Failed to submit report");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Report Host</DialogTitle>
          <DialogDescription>
            Report {hostName} for inappropriate behavior or violations of our
            terms of service.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for reporting *</Label>
            <Select
              value={formData.reason}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, reason: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_REASONS.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Additional details (optional)</Label>
            <Textarea
              id="description"
              placeholder="Please provide any additional details about your report..."
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={4}
              maxLength={500}
            />
            <p className="text-sm text-gray-500">
              {formData.description.length}/500 characters
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.reason}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
