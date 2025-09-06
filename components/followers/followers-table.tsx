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
import { UserMinus, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { getHostFollowers, removeFollower } from "@/lib/actions/follow";
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

interface Follower {
  id: string;
  followedAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    createdAt: Date;
  };
}

interface FollowersTableProps {
  hostId?: string;
}

export function FollowersTable({ hostId }: FollowersTableProps) {
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [followerToRemove, setFollowerToRemove] = useState<Follower | null>(
    null
  );

  const fetchFollowers = async () => {
    try {
      const result = await getHostFollowers(hostId);
      if (result.success && result.data) {
        setFollowers(result.data);
      } else {
        toast.error("Failed to load followers", {
          description:
            result.error || "There was a problem loading your followers.",
        });
      }
    } catch (error) {
      console.error("Failed to fetch followers:", error);
      toast.error("Failed to load followers", {
        description:
          "There was a problem loading your followers. Please try refreshing the page.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowers();
  }, [hostId]);

  const handleRemoveClick = (follower: Follower) => {
    setFollowerToRemove(follower);
  };

  const handleRemoveFollower = async () => {
    if (!followerToRemove) return;

    try {
      const result = await removeFollower(followerToRemove.id);
      if (result.success) {
        toast.success("Follower removed successfully", {
          description:
            result.message ||
            `${followerToRemove.user.name} has been removed from your followers.`,
        });
        fetchFollowers(); // Refresh the list
      } else {
        toast.error("Failed to remove follower", {
          description:
            result.error || "An error occurred while removing the follower",
        });
      }
    } catch (error) {
      toast.error("Failed to remove follower", {
        description: "An unexpected error occurred",
      });
    } finally {
      setFollowerToRemove(null);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-100 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-gray-50">
              <TableHead>Follower</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>
                Followed At
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="ml-1 h-4 w-4 inline-block text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>When this user started following you</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableHead>
              <TableHead>Member Since</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(3)].map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-4 w-[150px]" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[200px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[100px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[100px]" />
                </TableCell>
                <TableCell>
                  <div className="flex justify-center">
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
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-100 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-gray-50">
              <TableHead>Follower</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>
                Followed At
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="ml-1 h-4 w-4 inline-block text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>When this user started following you</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableHead>
              <TableHead>Member Since</TableHead>
              <TableHead className="text-end">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {followers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="text-gray-500">
                    <p className="text-lg font-medium mb-2">No followers yet</p>
                    <p className="text-sm">
                      When users follow you, they'll appear here.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              followers.map((follower) => (
                <TableRow key={follower.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={follower.user.avatar || undefined}
                          alt={follower.user.name}
                        />
                        <AvatarFallback>
                          {follower.user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900">
                          {follower.user.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {follower.user.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-600">{follower.user.email}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-600">
                      {format(new Date(follower.followedAt), "MMM d, yyyy")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-600">
                      {format(new Date(follower.user.createdAt), "MMM d, yyyy")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                              onClick={() => handleRemoveClick(follower)}
                            >
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Remove follower</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={!!followerToRemove}
        onOpenChange={() => setFollowerToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Follower</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {followerToRemove?.user.name} from
              your followers? They will no longer receive updates about your
              events.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveFollower}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove Follower
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
