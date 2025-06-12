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
import { Trash2, Eye, Wallet, Copy, Users } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { getAllReferrers, deleteReferrer } from "@/lib/actions/referrer";
import { UserStatus } from "@prisma/client";
import { toast } from "sonner";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ReferredUser {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

interface Referrer {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  walletBalance: number;
  referralCode: string | null;
  createdAt: Date;
  updatedAt: Date;
  phone: string | null;
  referralCount: number;
  referredUsers: ReferredUser[];
}

export function ReferrersTable() {
  const [selectedReferrers, setSelectedReferrers] = useState<string[]>([]);
  const [referrers, setReferrers] = useState<Referrer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedReferrer, setSelectedReferrer] = useState<Referrer | null>(
    null
  );
  const [showReferredUsers, setShowReferredUsers] = useState(false);

  useEffect(() => {
    const fetchReferrers = async () => {
      try {
        const result = await getAllReferrers();
        if (result.success && result.data) {
          const formattedReferrers = result.data.map((referrer) => ({
            ...referrer,
            walletBalance: Number(referrer.walletBalance),
          }));
          setReferrers(formattedReferrers);
        }
      } catch (error) {
        console.error("Failed to fetch referrers:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReferrers();
  }, []);

  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedReferrers(referrers.map((referrer) => referrer.id));
    } else {
      setSelectedReferrers([]);
    }
  };

  const toggleReferrer = (referrerId: string) => {
    setSelectedReferrers((prev) => {
      if (prev.includes(referrerId)) {
        return prev.filter((id) => id !== referrerId);
      } else {
        return [...prev, referrerId];
      }
    });
  };

  const handleCopyReferralUrl = (referralCode: string) => {
    const url = `${process.env.NEXT_PUBLIC_URL}/signup?ref=${referralCode}`;
    navigator.clipboard.writeText(url);
    toast.success("Referral URL copied to clipboard", {
      description: "You can now share this link with others",
    });
  };

  const handleViewReferredUsers = (referrer: Referrer) => {
    setSelectedReferrer(referrer);
    setShowReferredUsers(true);
  };

  const handleDeleteReferrer = async (referrerId: string) => {
    try {
      setIsDeleting(true);
      const result = await deleteReferrer(referrerId);

      if (result.success) {
        setReferrers((prevReferrers) =>
          prevReferrers.filter((referrer) => referrer.id !== referrerId)
        );
        toast.success("Referrer deleted successfully", {
          description: "Referrer has been deleted successfully",
        });
      } else {
        toast.error(result.error || "Failed to delete referrer");
      }
    } catch (error) {
      console.error("Error deleting referrer:", error);
      toast.error("An error occurred while deleting the referrer");
    } finally {
      setIsDeleting(false);
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

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-100 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-gray-50">
              <TableHead className="w-[30px]">
                <Skeleton className="h-4 w-4" />
              </TableHead>
              <TableHead className="w-[300px]">Referrer</TableHead>
              <TableHead>Referral Code</TableHead>
              <TableHead>Referral Count</TableHead>
              <TableHead>Wallet Balance</TableHead>
              <TableHead>Created Date</TableHead>
              <TableHead>Last Updated</TableHead>
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
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-3 w-[150px]" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[100px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[100px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[100px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[100px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[100px]" />
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
                    selectedReferrers.length === referrers.length &&
                    referrers.length > 0
                  }
                  onCheckedChange={(checked) => toggleAll(checked as boolean)}
                />
              </TableHead>
              <TableHead className="w-[300px]">Referrer</TableHead>
              <TableHead>Referral Code</TableHead>
              <TableHead>Referral Count</TableHead>
              <TableHead>Wallet Balance</TableHead>
              <TableHead>Created Date</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {referrers.map((referrer) => (
              <TableRow key={referrer.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedReferrers.includes(referrer.id)}
                    onCheckedChange={() => toggleReferrer(referrer.id)}
                  />
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <span className="font-medium">{referrer.name}</span>
                    <p className="text-sm text-gray-500">{referrer.email}</p>
                  </div>
                </TableCell>
                <TableCell>
                  {referrer.referralCode ? (
                    <code className="rounded bg-gray-100 px-2 py-1 text-sm">
                      {referrer.referralCode}
                    </code>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>{referrer.referralCount}</TableCell>
                <TableCell>
                  {formatCurrency(referrer.walletBalance || 0)}
                </TableCell>
                <TableCell>
                  {format(new Date(referrer.createdAt), "MMM d, yyyy")}
                </TableCell>
                <TableCell>
                  {format(new Date(referrer.updatedAt), "MMM d, yyyy")}
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      referrer.status === "ACTIVE"
                        ? "bg-green-50 text-green-700"
                        : referrer.status === "INACTIVE"
                        ? "bg-gray-50 text-gray-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {referrer.status}
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
                            className="h-8 w-8 text-gray-400 hover:text-gray-600"
                            onClick={() => handleViewReferredUsers(referrer)}
                          >
                            <Users className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>View referred users</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-gray-600"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>View details</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-gray-600"
                          >
                            <Wallet className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Manage wallet</p>
                        </TooltipContent>
                      </Tooltip>

                      {referrer.referralCode && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-gray-600"
                              onClick={() =>
                                handleCopyReferralUrl(referrer.referralCode!)
                              }
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Copy referral link</p>
                          </TooltipContent>
                        </Tooltip>
                      )}

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-400 hover:text-red-600"
                                disabled={isDeleting}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Referrer
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this referrer?
                                  This action cannot be undone. All associated
                                  data including referral links and wallet
                                  balance will be permanently deleted.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleDeleteReferrer(referrer.id)
                                  }
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delete referrer</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showReferredUsers} onOpenChange={setShowReferredUsers}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Referred Users</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Joined Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedReferrer?.referredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {format(new Date(user.createdAt), "MMM d, yyyy")}
                    </TableCell>
                  </TableRow>
                ))}
                {selectedReferrer?.referredUsers.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-gray-500"
                    >
                      No referred users yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
