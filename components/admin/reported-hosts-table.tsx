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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Eye,
  Ban,
  CheckCircle2,
  X,
  AlertTriangle,
  MessageSquare,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  getAllHostReports,
  updateHostReportStatus,
  blockHost,
} from "@/lib/actions/host";

interface HostReport {
  id: string;
  reason: string;
  description: string | null;
  status: "PENDING" | "REVIEWED" | "RESOLVED" | "DISMISSED";
  adminNotes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  hostId: string;
  reporterId: string;
  reportedHost: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    status: "ACTIVE" | "INACTIVE" | "PENDING";
  };
  reportingUser: {
    id: string;
    name: string;
    email: string;
  };
}

export function ReportedHostsTable() {
  const [reports, setReports] = useState<HostReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<HostReport | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [newStatus, setNewStatus] = useState<
    "REVIEWED" | "RESOLVED" | "DISMISSED"
  >("REVIEWED");

  const fetchReports = async () => {
    try {
      const result = await getAllHostReports();
      if (result.success && result.data) {
        setReports(result.data as unknown as HostReport[]);
      } else {
        toast.error("Failed to load reports", {
          description: result.error || "Please try again",
        });
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Failed to load reports");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleUpdateStatus = async () => {
    if (!selectedReport) return;

    setIsUpdating(true);
    try {
      const result = await updateHostReportStatus(
        selectedReport.id,
        newStatus,
        adminNotes.trim() || undefined
      );

      if (result.success) {
        toast.success("Report status updated successfully");
        setSelectedReport(null);
        setAdminNotes("");
        fetchReports();
      } else {
        toast.error("Failed to update report status", {
          description: result.error || "Please try again",
        });
      }
    } catch (error) {
      console.error("Error updating report:", error);
      toast.error("Failed to update report status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBlockHost = async (hostId: string, hostName: string) => {
    if (
      !confirm(
        `Are you sure you want to block ${hostName}? This will prevent them from accessing the platform.`
      )
    ) {
      return;
    }

    try {
      const result = await blockHost(hostId);
      if (result.success) {
        toast.success(`${hostName} has been blocked successfully`);
        fetchReports();
      } else {
        toast.error("Failed to block host", {
          description: result.error || "Please try again",
        });
      }
    } catch (error) {
      console.error("Error blocking host:", error);
      toast.error("Failed to block host");
    }
  };

  const getStatusBadge = (status: HostReport["status"]) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge
            variant="outline"
            className="text-yellow-600 border-yellow-600"
          >
            Pending
          </Badge>
        );
      case "REVIEWED":
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            Reviewed
          </Badge>
        );
      case "RESOLVED":
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            Resolved
          </Badge>
        );
      case "DISMISSED":
        return (
          <Badge variant="outline" className="text-gray-600 border-gray-600">
            Dismissed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getHostStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-100 text-green-700">Active</Badge>;
      case "INACTIVE":
        return <Badge className="bg-red-100 text-red-700">Blocked</Badge>;
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-100 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reported Host</TableHead>
              <TableHead>Reported By</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-40" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-100 bg-white">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-gray-50">
            <TableHead>Reported Host</TableHead>
            <TableHead>Reported By</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-end">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => (
            <TableRow key={report.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={report.reportedHost.avatar || undefined}
                    />
                    <AvatarFallback>
                      {report.reportedHost.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{report.reportedHost.name}</p>
                    <p className="text-sm text-gray-500">
                      {report.reportedHost.email}
                    </p>
                    {getHostStatusBadge(report.reportedHost.status)}
                  </div>
                </div>
              </TableCell>

              <TableCell>
                <div>
                  <p className="font-medium">{report.reportingUser.name}</p>
                  <p className="text-sm text-gray-500">
                    {report.reportingUser.email}
                  </p>
                </div>
              </TableCell>

              <TableCell>
                <div>
                  <p className="font-medium">{report.reason}</p>
                  {report.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {report.description}
                    </p>
                  )}
                </div>
              </TableCell>

              <TableCell>{getStatusBadge(report.status)}</TableCell>

              <TableCell>
                {format(new Date(report.createdAt), "MMM d, yyyy")}
              </TableCell>

              <TableCell>
                <div className="flex justify-end gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Dialog open={!!selectedReport}>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                              onClick={() => {
                                setSelectedReport(report);
                                setAdminNotes(report.adminNotes || "");
                                setNewStatus("REVIEWED");
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Report Details</DialogTitle>
                              <DialogDescription>
                                Review and update the status of this report
                              </DialogDescription>
                            </DialogHeader>

                            {selectedReport && (
                              <div className="space-y-6 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label>Reported Host</Label>
                                    <div className="flex items-center gap-3">
                                      <Avatar>
                                        <AvatarImage
                                          src={
                                            selectedReport.reportedHost
                                              .avatar || undefined
                                          }
                                        />
                                        <AvatarFallback>
                                          {selectedReport.reportedHost.name
                                            .charAt(0)
                                            .toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <p className="font-medium">
                                          {selectedReport.reportedHost.name}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                          {selectedReport.reportedHost.email}
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Reported By</Label>
                                    <div>
                                      <p className="font-medium">
                                        {selectedReport.reportingUser.name}
                                      </p>
                                      <p className="text-sm text-gray-500">
                                        {selectedReport.reportingUser.email}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label>Report Details</Label>
                                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                    <p>
                                      <span className="font-medium">
                                        Reason:
                                      </span>{" "}
                                      {selectedReport.reason}
                                    </p>
                                    <p>
                                      <span className="font-medium">Date:</span>{" "}
                                      {format(
                                        new Date(selectedReport.createdAt),
                                        "PPP"
                                      )}
                                    </p>
                                    <p>
                                      <span className="font-medium">
                                        Status:
                                      </span>{" "}
                                      {getStatusBadge(selectedReport.status)}
                                    </p>
                                    {selectedReport.description && (
                                      <div>
                                        <span className="font-medium">
                                          Description:
                                        </span>
                                        <p className="mt-1 text-gray-700">
                                          {selectedReport.description}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="status">Update Status</Label>
                                  <Select
                                    value={newStatus}
                                    onValueChange={(value: any) =>
                                      setNewStatus(value)
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="REVIEWED">
                                        Reviewed
                                      </SelectItem>
                                      <SelectItem value="RESOLVED">
                                        Resolved
                                      </SelectItem>
                                      <SelectItem value="DISMISSED">
                                        Dismissed
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="admin-notes">
                                    Admin Notes
                                  </Label>
                                  <Textarea
                                    id="admin-notes"
                                    value={adminNotes}
                                    onChange={(e) =>
                                      setAdminNotes(e.target.value)
                                    }
                                    placeholder="Add notes about your review..."
                                    rows={3}
                                  />
                                </div>
                              </div>
                            )}

                            <div className="flex justify-between">
                              <Button
                                variant="destructive"
                                onClick={() =>
                                  selectedReport &&
                                  handleBlockHost(
                                    selectedReport.reportedHost.id,
                                    selectedReport.reportedHost.name
                                  )
                                }
                                disabled={
                                  selectedReport?.reportedHost.status ===
                                  "INACTIVE"
                                }
                              >
                                <Ban className="h-4 w-4 mr-2" />
                                {selectedReport?.reportedHost.status ===
                                "INACTIVE"
                                  ? "Already Blocked"
                                  : "Block Host"}
                              </Button>

                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedReport(null);
                                    setAdminNotes("");
                                  }}
                                  disabled={isUpdating}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={handleUpdateStatus}
                                  disabled={isUpdating}
                                >
                                  {isUpdating ? "Updating..." : "Update Status"}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>View report details</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {reports.length === 0 && (
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Reports Found
          </h3>
          <p className="text-gray-600">
            There are no host reports to review at the moment.
          </p>
        </div>
      )}
    </div>
  );
}
