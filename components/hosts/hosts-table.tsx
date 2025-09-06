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
import { Ban, CheckCircle2, Edit } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { getAllHosts, blockHost, unblockHost } from "@/lib/actions/host";
import type { Host } from "@/lib/actions/host";
import { UserStatus } from "@prisma/client";
import { toast } from "sonner";
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
import { UpdateHostFeeDialog } from "@/components/admin/update-host-fee-dialog";

interface HostsTableProps {
  key?: string;
}

export function HostsTable({}: HostsTableProps) {
  const [hosts, setHosts] = useState<Host[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hostToBlock, setHostToBlock] = useState<Host | null>(null);
  const [hostToUnblock, setHostToUnblock] = useState<Host | null>(null);
  const [hostToUpdateFee, setHostToUpdateFee] = useState<Host | null>(null);

  const fetchHosts = async () => {
    try {
      const result = await getAllHosts();
      if (result.success && result.data) {
        setHosts(result.data);
      } else if (result.error) {
        toast.error("Failed to load hosts", {
          description:
            result.error || "Access denied. You need admin privileges.",
        });
      }
    } catch (error) {
      console.error("Failed to fetch hosts:", error);
      toast.error("Failed to load hosts", {
        description:
          "There was a problem loading the hosts. Please try refreshing the page.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHosts();
  }, []);

  const handleBlock = async () => {
    if (!hostToBlock) return;

    try {
      const result = await blockHost(hostToBlock.id);
      if (result.success) {
        toast.success("Host blocked successfully", {
          description: `${hostToBlock.name} has been blocked from the platform.`,
        });
        fetchHosts();
      } else {
        toast.error("Failed to block host", {
          description:
            result.error || "An error occurred while blocking the host",
        });
      }
    } catch (error) {
      toast.error("Failed to block host", {
        description: "An unexpected error occurred",
      });
    } finally {
      setHostToBlock(null);
    }
  };

  const handleUnblock = async () => {
    if (!hostToUnblock) return;

    try {
      const result = await unblockHost(hostToUnblock.id);
      if (result.success) {
        toast.success("Host unblocked successfully", {
          description: `${hostToUnblock.name} has been unblocked.`,
        });
        fetchHosts();
      } else {
        toast.error("Failed to unblock host", {
          description:
            result.error || "An error occurred while unblocking the host",
        });
      }
    } catch (error) {
      toast.error("Failed to unblock host", {
        description: "An unexpected error occurred",
      });
    } finally {
      setHostToUnblock(null);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-100 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-gray-50">
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total Events</TableHead>
              <TableHead>Total Bookings</TableHead>
              <TableHead>Total Revenue</TableHead>
              <TableHead>Fee %</TableHead>
              <TableHead>Last Event</TableHead>
              <TableHead className="text-end">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(3)].map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton className="h-4 w-[150px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[200px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[50px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[50px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[100px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[50px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[100px]" />
                </TableCell>
                <TableCell>
                  <div className="flex justify-end">
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
    <div className="rounded-lg border border-gray-100 bg-white">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-gray-50">
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Total Events</TableHead>
            <TableHead>Total Bookings</TableHead>
            <TableHead>Total Revenue</TableHead>
            <TableHead>Fee %</TableHead>
            <TableHead>Last Event</TableHead>
            <TableHead className="text-end">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {hosts.map((host) => (
            <TableRow key={host.id}>
              <TableCell className="font-medium">{host.name}</TableCell>
              <TableCell>{host.email}</TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    host.status === UserStatus.ACTIVE
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {host.status === UserStatus.ACTIVE ? "Active" : "Blocked"}
                </span>
              </TableCell>
              <TableCell>{host.totalEvents}</TableCell>
              <TableCell>{host.totalBookings}</TableCell>
              <TableCell>₹{host.totalRevenue.toFixed(2)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    {host.hostFeePercentage !== null
                      ? `${host.hostFeePercentage}%`
                      : "Default"}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-blue-400 hover:text-blue-600 hover:bg-blue-50"
                    onClick={() => setHostToUpdateFee(host)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
              <TableCell>
                {host.lastEventDate
                  ? format(new Date(host.lastEventDate), "MMM d, yyyy")
                  : "-"}
              </TableCell>
              <TableCell>
                <div className="flex justify-end">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 ${
                            host.status === UserStatus.ACTIVE
                              ? "text-red-400 hover:text-red-600 hover:bg-red-50"
                              : "text-green-400 hover:text-green-600 hover:bg-green-50"
                          }`}
                          onClick={() =>
                            host.status === UserStatus.ACTIVE
                              ? setHostToBlock(host)
                              : setHostToUnblock(host)
                          }
                        >
                          {host.status === UserStatus.ACTIVE ? (
                            <Ban className="h-4 w-4" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {host.status === UserStatus.ACTIVE
                            ? "Block host"
                            : "Unblock host"}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog
        open={!!hostToBlock}
        onOpenChange={() => setHostToBlock(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will block the host from accessing the platform. They will
              not be able to manage their events or create new ones.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBlock}
              className="bg-red-600 hover:bg-red-700"
            >
              Block
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!hostToUnblock}
        onOpenChange={() => setHostToUnblock(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will unblock the host and restore their access to the
              platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnblock}
              className="bg-green-600 hover:bg-green-700"
            >
              Unblock
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <UpdateHostFeeDialog
        host={hostToUpdateFee}
        open={!!hostToUpdateFee}
        onOpenChange={() => setHostToUpdateFee(null)}
        onSuccess={fetchHosts}
      />
    </div>
  );
}
