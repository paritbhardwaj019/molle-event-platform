"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { MoreHorizontal, Trash2, Flag } from "lucide-react";
import { toast } from "sonner";

interface ChatActionsProps {
  conversationId: string;
  conversation?: any; // Add conversation data
  onDelete: (conversation?: any) => void;
  disabled?: boolean;
}

export function ChatActions({
  conversationId,
  conversation,
  onDelete,
  disabled = false,
}: ChatActionsProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleDelete = async () => {
    try {
      const response = await fetch(
        `/api/messages/user-host/${conversationId}/delete`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete conversation");
      }

      onDelete(conversation);
      setDeleteDialogOpen(false);
      toast.success("Conversation deleted successfully");
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast.error("Failed to delete conversation");
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim()) {
      toast.error("Please provide a reason for reporting");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        `/api/messages/user-host/${conversationId}/report`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason: reportReason.trim() }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to report conversation");
      }

      setReportDialogOpen(false);
      setReportReason("");
      toast.success("Conversation reported successfully");
    } catch (error) {
      console.error("Error reporting conversation:", error);
      toast.error("Failed to report conversation");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-center space-x-1">
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            className="h-8 w-8 p-0 text-gray-400 hover:text-red-400 hover:bg-gray-700"
            title="Delete conversation"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">
              Delete Conversation
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-300">
              Are you sure you want to delete this conversation? This action
              cannot be undone and all messages will be permanently removed.
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                disabled={submitting}
                className="bg-red-600 hover:bg-red-700"
              >
                {submitting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
            title="Report conversation"
          >
            <Flag className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">
              Report Conversation
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Reason for reporting
              </label>
              <Textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Please describe the issue..."
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                rows={4}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setReportDialogOpen(false)}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReport}
                disabled={submitting || !reportReason.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                {submitting ? "Reporting..." : "Report"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
