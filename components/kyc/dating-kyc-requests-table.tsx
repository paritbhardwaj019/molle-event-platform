"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Eye, CheckCircle, XCircle, Clock, User } from "lucide-react";
import { toast } from "sonner";
import {
  getAllDatingKycRequests,
  approveDatingKyc,
  rejectDatingKyc,
} from "@/lib/actions/dating-admin";

interface DatingKycRequest {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  docType: "AADHAAR" | "PASSPORT" | "DRIVING_LICENSE";
  selfieUrl: string;
  docFrontUrl: string;
  docBackUrl?: string;
  reason?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

export function DatingKycRequestsTable() {
  const [requests, setRequests] = useState<DatingKycRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] =
    useState<DatingKycRequest | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchRequests = async () => {
    try {
      const result = await getAllDatingKycRequests();
      if (result.success && result.data) {
        setRequests(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch KYC requests:", error);
      toast.error("Failed to load KYC requests");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleView = (request: DatingKycRequest) => {
    setSelectedRequest(request);
    setShowViewDialog(true);
  };

  const handleApprove = async (requestId: string) => {
    setIsProcessing(true);
    try {
      const result = await approveDatingKyc(requestId);
      if (result.success) {
        toast.success("KYC request approved successfully");
        fetchRequests();
      } else {
        toast.error(result.error || "Failed to approve KYC request");
      }
    } catch (error) {
      console.error("Approve error:", error);
      toast.error("Failed to approve KYC request");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    setIsProcessing(true);
    try {
      const result = await rejectDatingKyc(
        selectedRequest.id,
        rejectReason.trim()
      );
      if (result.success) {
        toast.success("KYC request rejected successfully");
        setShowRejectDialog(false);
        setRejectReason("");
        setSelectedRequest(null);
        fetchRequests();
      } else {
        toast.error(result.error || "Failed to reject KYC request");
      }
    } catch (error) {
      console.error("Reject error:", error);
      toast.error("Failed to reject KYC request");
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Pending
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Approved
          </Badge>
        );
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getDocTypeLabel = (type: string) => {
    switch (type) {
      case "AADHAAR":
        return "Aadhaar Card";
      case "PASSPORT":
        return "Passport";
      case "DRIVING_LICENSE":
        return "Driving License";
      default:
        return type;
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-100 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-gray-50">
              <TableHead>User</TableHead>
              <TableHead>Document Type</TableHead>
              <TableHead>Submitted At</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32 mt-1" />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-16" />
                </TableCell>
                <TableCell>
                  <div className="flex justify-center gap-2">
                    <Skeleton className="h-8 w-8" />
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

  const pendingRequests = requests.filter((req) => req.status === "PENDING");
  const otherRequests = requests.filter((req) => req.status !== "PENDING");

  return (
    <div className="space-y-6">
      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-yellow-700">
            Pending Review ({pendingRequests.length})
          </h3>
          <div className="rounded-lg border border-gray-100 bg-white">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-gray-50">
                  <TableHead>User</TableHead>
                  <TableHead>Document Type</TableHead>
                  <TableHead>Submitted At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={request.user.avatar} />
                          <AvatarFallback>
                            <User className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{request.user.name}</p>
                          <p className="text-sm text-gray-600">
                            {request.user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {getDocTypeLabel(request.docType)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {format(
                          new Date(request.createdAt),
                          "MMM d, yyyy 'at' h:mm a"
                        )}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleView(request)}
                          className="h-8 w-8"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleApprove(request.id)}
                          disabled={isProcessing}
                          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowRejectDialog(true);
                          }}
                          disabled={isProcessing}
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Other Requests */}
      {otherRequests.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-700">
            Processed Requests ({otherRequests.length})
          </h3>
          <div className="rounded-lg border border-gray-100 bg-white">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-gray-50">
                  <TableHead>User</TableHead>
                  <TableHead>Document Type</TableHead>
                  <TableHead>Submitted At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {otherRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={request.user.avatar} />
                          <AvatarFallback>
                            <User className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{request.user.name}</p>
                          <p className="text-sm text-gray-600">
                            {request.user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {getDocTypeLabel(request.docType)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {format(
                          new Date(request.createdAt),
                          "MMM d, yyyy 'at' h:mm a"
                        )}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      <div className="flex justify-center">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleView(request)}
                          className="h-8 w-8"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {requests.length === 0 && (
        <div className="text-center py-12">
          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No KYC requests
          </h3>
          <p className="text-gray-600">
            No dating KYC requests have been submitted yet.
          </p>
        </div>
      )}

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>KYC Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedRequest.user.avatar} />
                  <AvatarFallback>
                    <User className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedRequest.user.name}
                  </h3>
                  <p className="text-gray-600">{selectedRequest.user.email}</p>
                  <p className="text-sm text-gray-500">
                    Submitted{" "}
                    {format(
                      new Date(selectedRequest.createdAt),
                      "MMM d, yyyy 'at' h:mm a"
                    )}
                  </p>
                </div>
              </div>

              {/* Document Type */}
              <div>
                <h4 className="font-medium mb-2">Document Type</h4>
                <Badge variant="outline">
                  {getDocTypeLabel(selectedRequest.docType)}
                </Badge>
              </div>

              {/* Images */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Selfie */}
                <div>
                  <h4 className="font-medium mb-2">Selfie Photo</h4>
                  <img
                    src={selectedRequest.selfieUrl}
                    alt="Selfie"
                    className="w-full h-64 object-cover rounded-lg border"
                  />
                </div>

                {/* Document Front */}
                <div>
                  <h4 className="font-medium mb-2">Document Front</h4>
                  <img
                    src={selectedRequest.docFrontUrl}
                    alt="Document Front"
                    className="w-full h-64 object-cover rounded-lg border"
                  />
                </div>

                {/* Document Back (if Aadhaar) */}
                {selectedRequest.docType === "AADHAAR" &&
                  selectedRequest.docBackUrl && (
                    <div className="md:col-span-2">
                      <h4 className="font-medium mb-2">Document Back</h4>
                      <img
                        src={selectedRequest.docBackUrl}
                        alt="Document Back"
                        className="w-full h-64 object-cover rounded-lg border"
                      />
                    </div>
                  )}
              </div>

              {/* Rejection Reason (if rejected) */}
              {selectedRequest.status === "REJECTED" &&
                selectedRequest.reason && (
                  <div>
                    <h4 className="font-medium mb-2 text-red-600">
                      Rejection Reason
                    </h4>
                    <p className="text-gray-700 bg-red-50 p-3 rounded-lg">
                      {selectedRequest.reason}
                    </p>
                  </div>
                )}

              {/* Actions for pending requests */}
              {selectedRequest.status === "PENDING" && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={() => handleApprove(selectedRequest.id)}
                    disabled={isProcessing}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowViewDialog(false);
                      setShowRejectDialog(true);
                    }}
                    disabled={isProcessing}
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject KYC Request</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting this KYC request. This will
              be shown to the user.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3">
            <Label htmlFor="rejectReason">Rejection Reason *</Label>
            <Textarea
              id="rejectReason"
              placeholder="Enter the reason for rejection..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRejectReason("")}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={!rejectReason.trim() || isProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? "Rejecting..." : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
