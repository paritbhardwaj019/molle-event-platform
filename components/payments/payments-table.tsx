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
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { toast } from "sonner";
import { useLoggedInUser } from "@/lib/hooks/use-logged-in-user";
import {
  getAllPayoutRequests,
  getUserPayoutRequests,
  approvePayoutRequest,
  rejectPayoutRequest,
  type PayoutRequest,
} from "@/lib/actions/payout";
import { Check, X, Eye, Phone, CreditCard } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PayoutStatus } from "@prisma/client";

interface PaymentsTableProps {
  key?: string;
}

type FilterStatus = "all" | PayoutStatus;

export function PaymentsTable({}: PaymentsTableProps) {
  const { user } = useLoggedInUser();
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [payoutToApprove, setPayoutToApprove] = useState<PayoutRequest | null>(
    null
  );
  const [payoutToReject, setPayoutToReject] = useState<PayoutRequest | null>(
    null
  );
  const [payoutToView, setPayoutToView] = useState<PayoutRequest | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchPayouts = async () => {
    try {
      const result =
        user?.role === "ADMIN"
          ? await getAllPayoutRequests()
          : await getUserPayoutRequests();

      if (result.success && result.data) {
        setPayouts(result.data);
      } else {
        toast.error("Failed to load payout requests", {
          description:
            result.error || "There was a problem loading payout requests.",
        });
      }
    } catch (error) {
      console.error("Failed to fetch payouts:", error);
      toast.error("Failed to load payout requests", {
        description:
          "An unexpected error occurred. Please try refreshing the page.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPayouts();
    }
  }, [user]);

  const handleApprove = async () => {
    if (!payoutToApprove) return;

    try {
      setIsProcessing(true);
      const result = await approvePayoutRequest(payoutToApprove.id);

      if (result.success) {
        toast.success("Payout approved successfully", {
          description: `₹${payoutToApprove.amount.toLocaleString()} has been approved for ${
            payoutToApprove.user.name
          }`,
        });
        fetchPayouts();
      } else {
        toast.error("Failed to approve payout", {
          description:
            result.error || "An error occurred while approving the payout",
        });
      }
    } catch (error) {
      toast.error("Failed to approve payout", {
        description: "An unexpected error occurred",
      });
    } finally {
      setIsProcessing(false);
      setPayoutToApprove(null);
    }
  };

  const handleReject = async () => {
    if (!payoutToReject) return;

    try {
      setIsProcessing(true);
      const result = await rejectPayoutRequest(payoutToReject.id);

      if (result.success) {
        toast.success("Payout rejected successfully", {
          description: `Payout request for ₹${payoutToReject.amount.toLocaleString()} has been rejected`,
        });
        fetchPayouts();
      } else {
        toast.error("Failed to reject payout", {
          description:
            result.error || "An error occurred while rejecting the payout",
        });
      }
    } catch (error) {
      toast.error("Failed to reject payout", {
        description: "An unexpected error occurred",
      });
    } finally {
      setIsProcessing(false);
      setPayoutToReject(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusBadge = (status: PayoutStatus) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge
            variant="secondary"
            className="bg-yellow-50 text-yellow-700 border-yellow-200"
          >
            Pending
          </Badge>
        );
      case "PROCESSING":
        return (
          <Badge
            variant="secondary"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            Processing
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge
            variant="default"
            className="bg-green-50 text-green-700 border-green-200"
          >
            Completed
          </Badge>
        );
      case "FAILED":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "HOST":
        return (
          <Badge
            variant="outline"
            className="bg-purple-50 text-purple-700 border-purple-200"
          >
            Host
          </Badge>
        );
      case "REFERRER":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            Referrer
          </Badge>
        );
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const filteredPayouts = payouts.filter((payout) => {
    if (filterStatus === "all") return true;
    return payout.status === filterStatus;
  });

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-100 bg-white">
        <div className="p-4 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              {user?.role === "ADMIN"
                ? "All Payout Requests"
                : "Your Withdrawal Requests"}
            </h3>
            <Skeleton className="h-10 w-[180px]" />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-gray-50">
              {user?.role === "ADMIN" && <TableHead>User</TableHead>}
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Requested At</TableHead>
              <TableHead>Bank Details</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(3)].map((_, index) => (
              <TableRow key={index}>
                {user?.role === "ADMIN" && (
                  <TableCell>
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </TableCell>
                )}
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <div className="flex justify-center gap-2">
                    <Skeleton className="h-8 w-8" />
                    {user?.role === "ADMIN" && <Skeleton className="h-8 w-8" />}
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
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-100 bg-white">
        <div className="p-4 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              {user?.role === "ADMIN"
                ? "All Payout Requests"
                : "Your Withdrawal Requests"}
            </h3>
            <Select
              value={filterStatus}
              onValueChange={(value: FilterStatus) => setFilterStatus(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Requests</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-gray-50">
              {user?.role === "ADMIN" && <TableHead>User</TableHead>}
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Requested At</TableHead>
              <TableHead>Bank Details</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayouts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={user?.role === "ADMIN" ? 6 : 5}
                  className="text-center py-8 text-gray-500"
                >
                  {filterStatus === "all"
                    ? "No payout requests found"
                    : `No ${filterStatus.toLowerCase()} requests found`}
                </TableCell>
              </TableRow>
            ) : (
              filteredPayouts.map((payout) => (
                <TableRow key={payout.id}>
                  {user?.role === "ADMIN" && (
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{payout.user.name}</p>
                          {getRoleBadge(payout.user.role)}
                        </div>
                        <p className="text-sm text-gray-500">
                          {payout.user.email}
                        </p>
                        <p className="text-xs text-gray-400">
                          Balance: {formatCurrency(payout.user.walletBalance)}
                        </p>
                      </div>
                    </TableCell>
                  )}
                  <TableCell>
                    <span className="font-semibold text-lg">
                      {formatCurrency(payout.amount)}
                    </span>
                  </TableCell>
                  <TableCell>{getStatusBadge(payout.status)}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm">
                        {format(new Date(payout.requestedAt), "MMM d, yyyy")}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(payout.requestedAt), "HH:mm")}
                      </p>
                      {payout.processedAt && (
                        <p className="text-xs text-gray-400">
                          Processed:{" "}
                          {format(new Date(payout.processedAt), "MMM d, yyyy")}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {payout.accountName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {payout.accountNumber
                          ? `****${payout.accountNumber.slice(-4)}`
                          : "N/A"}
                      </p>
                      <p className="text-xs text-gray-500">{payout.ifscCode}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                              onClick={() => setPayoutToView(payout)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View details</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      {user?.role === "ADMIN" &&
                        payout.status === "PENDING" && (
                          <>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-green-400 hover:text-green-600 hover:bg-green-50"
                                    onClick={() => setPayoutToApprove(payout)}
                                    disabled={isProcessing}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Approve payout</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => setPayoutToReject(payout)}
                                    disabled={isProcessing}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Reject payout</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </>
                        )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Approve Confirmation Dialog */}
      <AlertDialog
        open={!!payoutToApprove}
        onOpenChange={() => setPayoutToApprove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Payout Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this payout request for{" "}
              <strong>{formatCurrency(payoutToApprove?.amount || 0)}</strong> to{" "}
              <strong>{payoutToApprove?.user.name}</strong>?
              <br />
              <br />
              This will deduct the amount from their wallet balance and mark the
              payout as completed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? "Approving..." : "Approve Payout"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Confirmation Dialog */}
      <AlertDialog
        open={!!payoutToReject}
        onOpenChange={() => setPayoutToReject(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Payout Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this payout request for{" "}
              <strong>{formatCurrency(payoutToReject?.amount || 0)}</strong>{" "}
              from <strong>{payoutToReject?.user.name}</strong>?
              <br />
              <br />
              This action cannot be undone, but the user can submit a new
              request.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? "Rejecting..." : "Reject Payout"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Details Dialog */}
      <Dialog open={!!payoutToView} onOpenChange={() => setPayoutToView(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Payout Request Details</DialogTitle>
            <DialogDescription>
              Complete information about this withdrawal request
            </DialogDescription>
          </DialogHeader>

          {payoutToView && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Amount</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(payoutToView.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <div className="mt-1">
                    {getStatusBadge(payoutToView.status)}
                  </div>
                </div>
              </div>

              {user?.role === "ADMIN" && (
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    User Details
                  </p>
                  <div className="mt-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{payoutToView.user.name}</p>
                      {getRoleBadge(payoutToView.user.role)}
                    </div>
                    <p className="text-sm text-gray-600">
                      {payoutToView.user.email}
                    </p>
                    <p className="text-sm text-gray-500">
                      Wallet Balance:{" "}
                      {formatCurrency(payoutToView.user.walletBalance)}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-gray-500">
                  Bank Details
                </p>
                <div className="mt-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">
                        {payoutToView.accountName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {payoutToView.accountNumber
                          ? `****${payoutToView.accountNumber.slice(-4)}`
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 flex items-center justify-center">
                      <span className="text-xs font-mono text-gray-400">
                        IFSC
                      </span>
                    </div>
                    <p className="text-sm">{payoutToView.ifscCode}</p>
                  </div>
                  {payoutToView.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <p className="text-sm">{payoutToView.phone}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Requested At
                  </p>
                  <p className="text-sm">
                    {format(
                      new Date(payoutToView.requestedAt),
                      "MMM d, yyyy HH:mm"
                    )}
                  </p>
                </div>
                {payoutToView.processedAt && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Processed At
                    </p>
                    <p className="text-sm">
                      {format(
                        new Date(payoutToView.processedAt),
                        "MMM d, yyyy HH:mm"
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
