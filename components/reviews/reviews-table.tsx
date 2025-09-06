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
import { Skeleton } from "@/components/ui/skeleton";
import { getHostEventReviews } from "@/lib/actions/review";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import type { Review } from "@/lib/actions/review";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface ReviewsTableProps {
  hostId?: string;
}

export function ReviewsTable({ hostId }: ReviewsTableProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const result = await getHostEventReviews(hostId);

        if (result.success && result.data) {
          setReviews(result.data);
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, [hostId]);

  const openImageDialog = (review: Review) => {
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No reviews yet</p>
        <p className="text-sm text-gray-400 mt-1">
          Reviews will appear here once customers start reviewing your events
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Review</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.map((review) => (
              <TableRow key={review.id}>
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
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{review.event.title}</p>
                    <Link
                      href={`/events/${(review.event as any).slug}`}
                      className="text-xs text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                    >
                      View Event
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <StarRating rating={review.rating} readonly size="sm" />
                    <span className="text-sm font-medium">{review.rating}</span>
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
                  <div className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(review.createdAt), {
                      addSuffix: true,
                    })}
                  </div>
                </TableCell>
                <TableCell>
                  {review.media && review.media.length > 0 ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                      onClick={() => openImageDialog(review)}
                    >
                      <ImageIcon className="h-4 w-4" />
                      <span className="text-xs">{review.media.length}</span>
                    </Button>
                  ) : (
                    <Badge
                      variant={
                        review.rating >= 4
                          ? "default"
                          : review.rating >= 3
                            ? "secondary"
                            : "destructive"
                      }
                      className="text-xs"
                    >
                      {review.rating >= 4
                        ? "Positive"
                        : review.rating >= 3
                          ? "Neutral"
                          : "Negative"}
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

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
    </>
  );
}
