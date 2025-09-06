"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  getAllInvites,
  approveInvite,
  rejectInvite,
} from "@/lib/actions/invite";
import { InviteStatus } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, X, Eye } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface InviteRequest {
  id: string;
  status: InviteStatus;
  message: string | null;
  formData: any;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  event: {
    id: string;
    title: string;
    slug: string;
  };
}

export function InvitesTable() {
  const [selectedInvites, setSelectedInvites] = useState<string[]>([]);
  const [invites, setInvites] = useState<InviteRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showViewDataDialog, setShowViewDataDialog] = useState(false);
  const [selectedInviteId, setSelectedInviteId] = useState<string | null>(null);
  const [selectedInviteForView, setSelectedInviteForView] =
    useState<InviteRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    const fetchInvites = async () => {
      try {
        const result = await getAllInvites();
        if (result.success && result.data) {
          setInvites(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch invites:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvites();
  }, []);

  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedInvites(invites.map((invite) => invite.id));
    } else {
      setSelectedInvites([]);
    }
  };

  const toggleInvite = (inviteId: string) => {
    setSelectedInvites((prev) => {
      if (prev.includes(inviteId)) {
        return prev.filter((id) => id !== inviteId);
      } else {
        return [...prev, inviteId];
      }
    });
  };

  const handleApprove = async (inviteId: string) => {
    try {
      const result = await approveInvite({ inviteId });
      if (result.success) {
        setInvites((prev) =>
          prev.map((invite) =>
            invite.id === inviteId
              ? { ...invite, status: InviteStatus.APPROVED }
              : invite
          )
        );
        toast.success("Invite request approved");
      } else {
        toast.error(result.error || "Failed to approve invite");
      }
    } catch (error) {
      toast.error("An error occurred while approving the invite");
    }
  };

  const handleReject = async () => {
    if (!selectedInviteId || !rejectReason.trim()) return;

    try {
      const result = await rejectInvite({
        inviteId: selectedInviteId,
        reason: rejectReason,
      });

      if (result.success) {
        setInvites((prev) =>
          prev.map((invite) =>
            invite.id === selectedInviteId
              ? { ...invite, status: InviteStatus.REJECTED }
              : invite
          )
        );
        toast.success("Invite request rejected");
        setShowRejectDialog(false);
        setRejectReason("");
        setSelectedInviteId(null);
      } else {
        toast.error(result.error || "Failed to reject invite");
      }
    } catch (error) {
      toast.error("An error occurred while rejecting the invite");
    }
  };

  const extractInstagramHandle = (message: string | null) => {
    if (!message) return "";
    const match = message.match(/Instagram: (@?\w+)/);
    return match ? match[1] : "";
  };

  const extractNotes = (message: string | null) => {
    if (!message) return "";
    const notes = message.split("\n\nNotes: ")[1];
    return notes || "";
  };

  const formatInstagramUrl = (handle: string) => {
    // Remove @ if present and any trailing whitespace
    const username = handle.replace("@", "").trim();
    return `https://www.instagram.com/${username}`;
  };

  const handleViewData = (invite: InviteRequest) => {
    setSelectedInviteForView(invite);
    setShowViewDataDialog(true);
  };

  const renderFormData = (formData: any) => {
    if (!formData || typeof formData !== "object") {
      return <p className="text-gray-500 text-sm">No form data available</p>;
    }

    return (
      <div className="space-y-3">
        {Object.entries(formData).map(([key, value]) => (
          <div key={key} className="space-y-1">
            <label className="text-sm font-medium text-gray-700 capitalize">
              {key
                .replace(/([A-Z])/g, " $1")
                .replace(/^./, (str) => str.toUpperCase())}
            </label>
            <div className="p-2 bg-gray-50 rounded border text-sm">
              {Array.isArray(value) ? (
                <div className="flex flex-wrap gap-1">
                  {value.map((item, index) => (
                    <Badge key={index} variant="secondary">
                      {item}
                    </Badge>
                  ))}
                </div>
              ) : typeof value === "object" ? (
                <pre className="whitespace-pre-wrap text-xs">
                  {JSON.stringify(value, null, 2)}
                </pre>
              ) : (
                <span>{String(value)}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-100 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-gray-50">
              <TableHead className="w-[30px]">
                <Skeleton className="h-4 w-4" />
              </TableHead>
              <TableHead>User</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Form Data</TableHead>
              <TableHead>Requested At</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton className="h-4 w-4" />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-48" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-20" />
                </TableCell>
                <TableCell>
                  <div className="flex justify-center gap-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-gray-100 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-gray-50">
              <TableHead className="w-[30px]">
                <Checkbox
                  checked={
                    selectedInvites.length === invites.length &&
                    invites.length > 0
                  }
                  onCheckedChange={(checked) => toggleAll(checked as boolean)}
                />
              </TableHead>
              <TableHead>User</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Form Data</TableHead>
              <TableHead>Requested At</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invites.map((invite) => (
              <TableRow key={invite.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedInvites.includes(invite.id)}
                    onCheckedChange={() => toggleInvite(invite.id)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={invite.user.avatar || undefined} />
                      <AvatarFallback className="bg-gray-200 text-gray-600">
                        {invite.user.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{invite.user.name}</p>
                      <p className="text-sm text-gray-500">
                        {invite.user.email}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/events/${invite.event.slug}`}
                    className="text-primary hover:underline"
                  >
                    {invite.event.title}
                  </Link>
                </TableCell>
                <TableCell>
                  {invite.formData &&
                  Object.keys(invite.formData).length > 0 ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewData(invite)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-3 w-3" />
                      View Data
                    </Button>
                  ) : (
                    <span className="text-gray-400 text-sm">No data</span>
                  )}
                </TableCell>
                <TableCell>
                  {format(new Date(invite.createdAt), "MMM d, yyyy")}
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      invite.status === "APPROVED"
                        ? "bg-green-50 text-green-700"
                        : invite.status === "REJECTED"
                          ? "bg-red-50 text-red-700"
                          : "bg-yellow-50 text-yellow-700"
                    }`}
                  >
                    {invite.status}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex justify-center gap-2">
                    {invite.status === "PENDING" && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleApprove(invite.id)}
                              className="h-8 w-8 text-gray-400 hover:text-green-600 hover:bg-gray-50"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Approve invite request</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedInviteId(invite.id);
                                setShowRejectDialog(true);
                              }}
                              className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-gray-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Reject invite request</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Invite Request</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Enter reason for rejection..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectReason("");
                setSelectedInviteId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason.trim()}
            >
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Data Dialog */}
      <Dialog open={showViewDataDialog} onOpenChange={setShowViewDataDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Invite Request Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 overflow-y-auto max-h-[60vh] pr-2">
            {selectedInviteForView && (
              <>
                {/* User Information */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 border-b pb-2">
                    User Information
                  </h4>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage
                        src={selectedInviteForView.user.avatar || undefined}
                      />
                      <AvatarFallback className="bg-gray-200 text-gray-600">
                        {selectedInviteForView.user.name
                          .slice(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {selectedInviteForView.user.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {selectedInviteForView.user.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Event Information */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 border-b pb-2">
                    Event Information
                  </h4>
                  <div>
                    <Link
                      href={`/events/${selectedInviteForView.event.slug}`}
                      className="text-primary hover:underline font-medium"
                    >
                      {selectedInviteForView.event.title}
                    </Link>
                    <p className="text-sm text-gray-500 mt-1">
                      Requested on{" "}
                      {format(
                        new Date(selectedInviteForView.createdAt),
                        "PPPP"
                      )}
                    </p>
                  </div>
                </div>

                {/* Form Data */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 border-b pb-2">
                    Form Submission
                  </h4>
                  {renderFormData(selectedInviteForView.formData)}
                </div>

                {/* Message/Notes */}
                {selectedInviteForView.message && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 border-b pb-2">
                      Additional Information
                    </h4>

                    {/* Instagram Handle */}
                    {extractInstagramHandle(selectedInviteForView.message) && (
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">
                          Instagram
                        </label>
                        <div className="p-2 bg-gray-50 rounded border text-sm">
                          <a
                            href={formatInstagramUrl(
                              extractInstagramHandle(
                                selectedInviteForView.message
                              )
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {extractInstagramHandle(
                              selectedInviteForView.message
                            )}
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {extractNotes(selectedInviteForView.message) && (
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">
                          Notes
                        </label>
                        <div className="p-2 bg-gray-50 rounded border text-sm">
                          {extractNotes(selectedInviteForView.message)}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Status */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 border-b pb-2">
                    Status
                  </h4>
                  <div>
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                        selectedInviteForView.status === "APPROVED"
                          ? "bg-green-50 text-green-700"
                          : selectedInviteForView.status === "REJECTED"
                            ? "bg-red-50 text-red-700"
                            : "bg-yellow-50 text-yellow-700"
                      }`}
                    >
                      {selectedInviteForView.status}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowViewDataDialog(false);
                setSelectedInviteForView(null);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
