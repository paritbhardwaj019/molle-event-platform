"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StarRating } from "@/components/ui/star-rating";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getEventReviews, getEventReviewStats } from "@/lib/actions/review";
import { formatDistanceToNow } from "date-fns";
import type { Review } from "@/lib/actions/review";
import { ReviewMediaGallery } from "./review-media-gallery";

interface ReviewsListProps {
  eventId: string;
  refreshTrigger?: number;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
}

export function ReviewsList({ eventId, refreshTrigger }: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      const [reviewsResult, statsResult] = await Promise.all([
        getEventReviews(eventId),
        getEventReviewStats(eventId),
      ]);

      if (reviewsResult.success && reviewsResult.data) {
        setReviews(reviewsResult.data);
      }

      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [eventId, refreshTrigger]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48 bg-gray-800" />
          <Skeleton className="h-6 w-24 bg-gray-800" />
        </div>
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-start space-x-4">
                <Skeleton className="h-10 w-10 rounded-full bg-gray-700" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32 bg-gray-700" />
                  <Skeleton className="h-4 w-24 bg-gray-700" />
                  <Skeleton className="h-16 w-full bg-gray-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">
          No reviews yet. Be the first to review this event!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Review Stats */}
      {stats && stats.totalReviews > 0 && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Reviews</h3>
            <Badge
              variant="secondary"
              className="bg-purple-100 text-purple-800"
            >
              {stats.totalReviews} review{stats.totalReviews !== 1 ? "s" : ""}
            </Badge>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <StarRating rating={stats.averageRating} readonly size="md" />
              <span className="text-white font-medium">
                {stats.averageRating.toFixed(1)}
              </span>
            </div>
            <span className="text-gray-400">
              Based on {stats.totalReviews} review
              {stats.totalReviews !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Rating Distribution */}
          <div className="mt-4 space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats.ratingDistribution[rating] || 0;
              const percentage =
                stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;

              return (
                <div key={rating} className="flex items-center gap-2 text-sm">
                  <span className="text-gray-300 w-8">{rating}★</span>
                  <div className="flex-1 bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-gray-400 w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Individual Reviews */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id} className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-start space-x-4">
                <Avatar>
                  <AvatarImage src={review.user.avatar || undefined} />
                  <AvatarFallback className="bg-purple-100 text-purple-700">
                    {review.user.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">
                        {review.user.name}
                      </p>
                      <p className="text-sm text-gray-400">
                        {formatDistanceToNow(new Date(review.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    <StarRating rating={review.rating} readonly size="sm" />
                  </div>

                  {review.comment && (
                    <p className="text-gray-300 leading-relaxed">
                      {review.comment}
                    </p>
                  )}

                  {/* Review Media */}
                  {review.media && review.media.length > 0 && (
                    <div className="mt-3">
                      <ReviewMediaGallery media={review.media} />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
