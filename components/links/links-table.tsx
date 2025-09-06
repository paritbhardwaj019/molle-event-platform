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
import { Copy, Info, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { getAllReferralLinks, deleteReferralLink } from "@/lib/actions/link";
import type { ReferralLink } from "@/lib/actions/link";
import { ReferralLinkType } from "@prisma/client";
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

interface LinksTableProps {
  key?: string;
  onLinkCreated?: () => void;
}

export function LinksTable({ onLinkCreated }: LinksTableProps) {
  const [links, setLinks] = useState<ReferralLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [linkToDelete, setLinkToDelete] = useState<ReferralLink | null>(null);

  const fetchLinks = async () => {
    try {
      const result = await getAllReferralLinks();
      if (result.success && result.data) {
        setLinks(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch links:", error);
      toast.error("Failed to load referral links", {
        description:
          "There was a problem loading your referral links. Please try refreshing the page.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const handleCopyLink = (
    referralCode: string,
    eventTitle?: string,
    eventSlug?: string
  ) => {
    const link = `${process.env.NEXT_PUBLIC_URL}/events/${eventSlug}?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    toast.success("Referral link copied", {
      description: `Share this link to earn rewards when users book tickets for ${
        eventTitle || "this event"
      }`,
    });
  };

  const handleDeleteClick = (link: ReferralLink) => {
    if (link.signupCount > 1) {
      toast.error("Cannot delete this link", {
        description:
          "You can't delete a link that has been used more than once.",
      });
      return;
    }
    setLinkToDelete(link);
  };

  const handleDelete = async () => {
    if (!linkToDelete) return;

    try {
      const result = await deleteReferralLink(linkToDelete.id);
      if (result.success) {
        toast.success("Link deleted successfully", {
          description: `The referral link for ${
            linkToDelete.event?.title || "the event"
          } has been permanently deleted.`,
        });
        fetchLinks();
      } else {
        toast.error("Failed to delete link", {
          description:
            result.error || "An error occurred while deleting the link",
        });
      }
    } catch (error) {
      toast.error("Failed to delete link", {
        description: "An unexpected error occurred",
      });
    } finally {
      setLinkToDelete(null);
    }
  };

  const filteredLinks = links;

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-100 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-gray-50">
              <TableHead>Event</TableHead>
              <TableHead>Generated At</TableHead>
              <TableHead>
                Bookings
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="ml-1 h-4 w-4 inline-block text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Total bookings made via this referral link</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(3)].map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton className="h-4 w-[200px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[100px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[50px]" />
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
              <TableHead>Event</TableHead>
              <TableHead>Generated At</TableHead>
              <TableHead>
                Bookings
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="ml-1 h-4 w-4 inline-block text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Total bookings made via this referral link</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableHead>
              <TableHead className="text-end">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLinks.map((link) => (
              <TableRow key={link.id}>
                <TableCell>
                  {link.event ? (
                    <Link
                      href={`/events/${link.event.slug}`}
                      className="text-blue-600 hover:underline"
                    >
                      {link.event.title}
                    </Link>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>
                  {format(new Date(link.createdAt), "MMM d, yyyy")}
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700">
                    {link.signupCount} bookings
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                            onClick={() =>
                              handleCopyLink(
                                link.referralCode,
                                link.event?.title,
                                link.event?.slug
                              )
                            }
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Copy referral link</p>
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
                            onClick={() => handleDeleteClick(link)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delete link</p>
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

      <AlertDialog
        open={!!linkToDelete}
        onOpenChange={() => setLinkToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this referral link. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
