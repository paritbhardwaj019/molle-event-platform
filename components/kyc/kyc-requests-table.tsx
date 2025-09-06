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
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  getAllKycRequests,
  approveKycRequest,
  rejectKycRequest,
  KycRequest,
} from "@/lib/actions/kyc";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, X, Eye, FileText } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function KycRequestsTable() {
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [requests, setRequests] = useState<KycRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null
  );
  const [selectedRequest, setSelectedRequest] = useState<KycRequest | null>(
    null
  );
  const [rejectReason, setRejectReason] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const result = await getAllKycRequests();
        if (result.success && result.data) {
          setRequests(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch KYC requests:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedRequests(requests.map((request) => request.id));
    } else {
      setSelectedRequests([]);
    }
  };

  const toggleRequest = (requestId: string) => {
    setSelectedRequests((prev) => {
      if (prev.includes(requestId)) {
        return prev.filter((id) => id !== requestId);
      } else {
        return [...prev, requestId];
      }
    });
  };

  const handleApprove = async (requestId: string) => {
    try {
      const result = await approveKycRequest({ requestId });
      if (result.success) {
        setRequests((prev) =>
          prev.map((request) =>
            request.id === requestId
              ? { ...request, status: "APPROVED" as const }
              : request
          )
        );
        toast.success("KYC request approved");
      } else {
        toast.error(result.error || "Failed to approve KYC request");
      }
    } catch (error) {
      toast.error("An error occurred while approving the KYC request");
    }
  };

  const handleReject = async () => {
    if (!selectedRequestId || !rejectReason.trim()) return;

    try {
      const result = await rejectKycRequest({
        requestId: selectedRequestId,
        reason: rejectReason,
      });

      if (result.success) {
        setRequests((prev) =>
          prev.map((request) =>
            request.id === selectedRequestId
              ? {
                  ...request,
                  status: "REJECTED" as const,
                  adminReason: rejectReason,
                }
              : request
          )
        );
        toast.success("KYC request rejected");
        setShowRejectDialog(false);
        setRejectReason("");
        setSelectedRequestId(null);
      } else {
        toast.error(result.error || "Failed to reject KYC request");
      }
    } catch (error) {
      toast.error("An error occurred while rejecting the KYC request");
    }
  };

  const openDetailsDialog = (request: KycRequest) => {
    setSelectedRequest(request);
    setShowDetailsDialog(true);
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
              <TableHead>Host</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Bank Details</TableHead>
              <TableHead>Submitted At</TableHead>
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
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-40" />
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
                    selectedRequests.length === requests.length &&
                    requests.length > 0
                  }
                  onCheckedChange={(checked) => toggleAll(checked as boolean)}
                />
              </TableHead>
              <TableHead>Host</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Event Details</TableHead>
              <TableHead>Submitted At</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedRequests.includes(request.id)}
                    onCheckedChange={() => toggleRequest(request.id)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-gray-200 text-gray-600">
                        {request.user.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{request.user.name}</p>
                      <p className="text-sm text-gray-500">
                        {request.user.email}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{request.contactNumber}</p>
                    <p className="text-sm text-gray-500">
                      WhatsApp: {request.whatsappNumber}
                    </p>
                    <p className="text-sm text-gray-500">{request.email}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{request.eventCity}</p>
                    <p className="text-sm text-gray-500">
                      {request.eventVenueCapacity}
                    </p>
                    <p className="text-xs text-gray-400">
                      DOB:{" "}
                      {format(new Date(request.dateOfBirth), "MMM d, yyyy")}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  {format(new Date(request.createdAt), "MMM d, yyyy")}
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      request.status === "APPROVED"
                        ? "bg-green-50 text-green-700"
                        : request.status === "REJECTED"
                        ? "bg-red-50 text-red-700"
                        : "bg-yellow-50 text-yellow-700"
                    }`}
                  >
                    {request.status}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex justify-center gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDetailsDialog(request)}
                            className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-gray-50"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>View details and documents</p>
                        </TooltipContent>
                      </Tooltip>

                      {request.status === "PENDING" && (
                        <>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleApprove(request.id)}
                                className="h-8 w-8 text-gray-400 hover:text-green-600 hover:bg-gray-50"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Approve KYC request</p>
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedRequestId(request.id);
                                  setShowRejectDialog(true);
                                }}
                                className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-gray-50"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Reject KYC request</p>
                            </TooltipContent>
                          </Tooltip>
                        </>
                      )}
                    </TooltipProvider>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>KYC Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Personal Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Name:</span>{" "}
                      {selectedRequest.name}
                    </div>
                    <div>
                      <span className="font-medium">Date of Birth:</span>{" "}
                      {format(
                        new Date(selectedRequest.dateOfBirth),
                        "MMM d, yyyy"
                      )}
                    </div>
                    <div>
                      <span className="font-medium">Call Number:</span>{" "}
                      {selectedRequest.contactNumber}
                    </div>
                    <div>
                      <span className="font-medium">WhatsApp:</span>{" "}
                      {selectedRequest.whatsappNumber}
                    </div>
                    <div>
                      <span className="font-medium">Email:</span>{" "}
                      {selectedRequest.email}
                    </div>
                    <div>
                      <span className="font-medium">Event City:</span>{" "}
                      {selectedRequest.eventCity}
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Bank Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Bank:</span>{" "}
                      {selectedRequest.bankName}
                    </div>
                    <div>
                      <span className="font-medium">IFSC Code:</span>{" "}
                      {selectedRequest.bankBranch}
                    </div>
                    <div>
                      <span className="font-medium">Account:</span>{" "}
                      {selectedRequest.accountNumber}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">
                  Event Venue Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Venue Details:</span>
                    <p className="mt-1 text-gray-600">
                      {selectedRequest.eventVenueDetails}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Venue Crowd Size:</span>{" "}
                    {selectedRequest.eventVenueCapacity}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">
                  Permissions & Security
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Will get permissions:</span>{" "}
                    <span
                      className={
                        selectedRequest.willGetPermissions
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {selectedRequest.willGetPermissions ? "Yes" : "No"}
                    </span>
                  </div>
                  {!selectedRequest.willGetPermissions &&
                    selectedRequest.permissionsExplanation && (
                      <div>
                        <span className="font-medium">
                          Permissions explanation:
                        </span>
                        <p className="mt-1 text-gray-600">
                          {selectedRequest.permissionsExplanation}
                        </p>
                      </div>
                    )}
                  <div>
                    <span className="font-medium">Will have security:</span>{" "}
                    <span
                      className={
                        selectedRequest.willHaveSecurity
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {selectedRequest.willHaveSecurity ? "Yes" : "No"}
                    </span>
                  </div>
                  {selectedRequest.securityDetails && (
                    <div>
                      <span className="font-medium">Security details:</span>
                      <p className="mt-1 text-gray-600">
                        {selectedRequest.securityDetails}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Agreements</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        selectedRequest.agreeToAssessment
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    ></span>
                    <span className="font-medium">Assessment Agreement:</span>
                    <span
                      className={
                        selectedRequest.agreeToAssessment
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {selectedRequest.agreeToAssessment
                        ? "Agreed"
                        : "Not Agreed"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        selectedRequest.understandPayouts
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    ></span>
                    <span className="font-medium">Payout Terms:</span>
                    <span
                      className={
                        selectedRequest.understandPayouts
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {selectedRequest.understandPayouts
                        ? "Understood"
                        : "Not Understood"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        selectedRequest.agreeSafetyResponsibilities
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    ></span>
                    <span className="font-medium">
                      Safety Responsibilities:
                    </span>
                    <span
                      className={
                        selectedRequest.agreeSafetyResponsibilities
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {selectedRequest.agreeSafetyResponsibilities
                        ? "Agreed"
                        : "Not Agreed"}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Documents</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    {
                      label: "Aadhar Front",
                      url: selectedRequest.aadharFrontUrl,
                    },
                    {
                      label: "Aadhar Back",
                      url: selectedRequest.aadharBackUrl,
                    },
                    { label: "PAN Front", url: selectedRequest.panFrontUrl },
                    { label: "PAN Back", url: selectedRequest.panBackUrl },
                  ].map(({ label, url }) => (
                    <div key={label} className="space-y-2">
                      <p className="text-sm font-medium">{label}</p>
                      <div className="relative border rounded-lg overflow-hidden">
                        <img
                          src={url}
                          alt={label}
                          className="w-full h-32 object-cover cursor-pointer hover:opacity-80"
                          onClick={() => setPreviewImage(url)}
                        />
                        <Button
                          variant="secondary"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6"
                          onClick={() => setPreviewImage(url)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedRequest.status === "REJECTED" &&
                selectedRequest.adminReason && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Rejection Reason
                    </h3>
                    <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                      {selectedRequest.adminReason}
                    </p>
                  </div>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject KYC Request</DialogTitle>
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
                setSelectedRequestId(null);
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

      {/* Image Preview Dialog */}
      <Dialog
        open={previewImage !== null}
        onOpenChange={() => setPreviewImage(null)}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Document Preview</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <img
              src={previewImage}
              alt="Document preview"
              className="w-full h-auto max-h-[70vh] object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
