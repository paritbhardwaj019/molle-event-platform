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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StarRating } from "@/components/ui/star-rating";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getAllReviews, deleteReview } from "@/lib/actions/review";
import { formatDistanceToNow } from "date-fns";
import {
  ExternalLink,
  Trash2,
  Image as ImageIcon,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import type { Review } from "@/lib/actions/review";
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
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface AdminReviewsTableProps {
  key?: string;
}

export function AdminReviewsTable({ key }: AdminReviewsTableProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const fetchReviews = async () => {
    try {
      const result = await getAllReviews();
      if (result.success && result.data) {
        setReviews(result.data);
      } else {
        toast.error("Failed to fetch reviews", {
          description: result.error || "Could not load reviews",
        });
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
      toast.error("Failed to load reviews", {
        description:
          "There was a problem loading reviews. Please try refreshing the page.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDeleteClick = (review: Review) => {
    setReviewToDelete(review);
  };

  const handleImageClick = (review: Review) => {
    if (review.media && review.media.length > 0) {
      setSelectedReview(review);
      setSelectedImageIndex(0);
    }
  };

  const closeImageDialog = () => {
    setSelectedReview(null);
  };

  const goToPrevious = () => {
    if (selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

  const goToNext = () => {
    if (
      selectedReview?.media &&
      selectedImageIndex < selectedReview.media.length - 1
    ) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

  const handleDelete = async () => {
    if (!reviewToDelete) return;

    try {
      const result = await deleteReview(reviewToDelete.id);
      if (result.success) {
        toast.success("Review deleted successfully", {
          description: `The review for ${reviewToDelete.event.title} has been permanently deleted.`,
        });
        fetchReviews();
      } else {
        toast.error("Failed to delete review", {
          description:
            result.error || "An error occurred while deleting the review",
        });
      }
    } catch (error) {
      toast.error("Failed to delete review", {
        description: "An unexpected error occurred",
      });
    } finally {
      setReviewToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-100 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-gray-50">
              <TableHead>Hosts</TableHead>
              <TableHead>Review Description</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Attachments</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton className="h-4 w-[150px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[200px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[80px]" />
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-[100px]" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[60px]" />
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

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No reviews found</p>
        <p className="text-sm text-gray-400 mt-1">
          Reviews will appear here once users start reviewing events
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-100 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-gray-50">
              <TableHead>Hosts</TableHead>
              <TableHead>Review Description</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Attachments</TableHead>
              <TableHead className="text-end">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.map((review) => (
              <TableRow key={review.id}>
                <TableCell>
                  <div className="space-y-1">
                    <p className="font-medium text-sm">
                      {review.event.host?.name || "Unknown Host"}
                    </p>
                    <Link
                      href={`/events/${review.event.slug || "#"}`}
                      className="text-xs text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                    >
                      View Event
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="max-w-xs">
                    {review.comment ? (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {review.comment}
                      </p>
                    ) : (
                      <span className="text-sm text-gray-400 italic">
                        No comment
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <StarRating rating={review.rating} readonly size="sm" />
                    <span className="text-sm font-medium">{review.rating}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={review.user.avatar || undefined} />
                      <AvatarFallback className="bg-purple-100 text-purple-700 text-xs">
                        {review.user.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{review.user.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(review.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {review.media && review.media.length > 0 ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                      onClick={() => handleImageClick(review)}
                    >
                      <ImageIcon className="h-4 w-4" />
                      <span className="text-xs">
                        {review.media.length} image
                        {review.media.length !== 1 ? "s" : ""}
                      </span>
                    </Button>
                  ) : (
                    <span className="text-sm text-gray-400">None</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteClick(review)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delete review</p>
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
        open={!!reviewToDelete}
        onOpenChange={() => setReviewToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this review. This action cannot be
              undone.
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

      {/* Image Dialog */}
      <Dialog open={!!selectedReview} onOpenChange={closeImageDialog}>
        <DialogContent className="max-w-4xl w-full h-[80vh] p-0 bg-black border-gray-800">
          {selectedReview?.media && selectedReview.media.length > 0 && (
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Close button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={closeImageDialog}
                className="absolute top-4 right-4 z-10 bg-black/50 text-white hover:bg-black/70"
              >
                <X className="w-4 h-4" />
              </Button>

              {/* Navigation buttons */}
              {selectedReview.media.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={goToPrevious}
                    disabled={selectedImageIndex === 0}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white hover:bg-black/70 disabled:opacity-30"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={goToNext}
                    disabled={
                      selectedImageIndex === selectedReview.media.length - 1
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white hover:bg-black/70 disabled:opacity-30"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </Button>
                </>
              )}

              {/* Media content */}
              <div className="relative w-full h-full">
                <Image
                  src={selectedReview.media[selectedImageIndex].secureUrl}
                  alt="Review media"
                  fill
                  className="object-contain"
                />
              </div>

              {/* Media counter */}
              {selectedReview.media.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {selectedImageIndex + 1} / {selectedReview.media.length}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
