"use client";

import { useState, useEffect } from "react";
import { useLoggedInUser } from "@/lib/hooks/use-logged-in-user";
import { PageHeader } from "@/components/page-header";
import { ReviewsTable } from "@/components/reviews/reviews-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StarRating } from "@/components/ui/star-rating";
import { getHostEventReviews, getEventReviewStats } from "@/lib/actions/review";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, MessageSquare, TrendingUp, Award } from "lucide-react";

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
  recentReviews: number;
}

export default function ReviewsPage() {
  const { user } = useLoggedInUser();
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id) return;

      try {
        const reviewsResult = await getHostEventReviews();

        if (reviewsResult.success && reviewsResult.data) {
          const reviews = reviewsResult.data;

          // Calculate stats
          const totalReviews = reviews.length;
          const averageRating =
            totalReviews > 0
              ? reviews.reduce((sum, review) => sum + review.rating, 0) /
                totalReviews
              : 0;

          // Rating distribution
          const ratingDistribution = reviews.reduce((acc, review) => {
            acc[review.rating] = (acc[review.rating] || 0) + 1;
            return acc;
          }, {} as Record<number, number>);

          // Recent reviews (last 30 days)
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const recentReviews = reviews.filter(
            (review) => new Date(review.createdAt) >= thirtyDaysAgo
          ).length;

          setStats({
            totalReviews,
            averageRating,
            ratingDistribution,
            recentReviews,
          });
        }
      } catch (error) {
        console.error("Error fetching review stats:", error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();
  }, [user?.id]);

  return (
    <div className="flex flex-col gap-8 p-8">
      <PageHeader
        title="Reviews & Ratings"
        subtitle="View and manage reviews for your events"
      />

      {/* Review Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {stats?.totalReviews || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Across all your events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Rating
            </CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">
                  {stats?.averageRating
                    ? stats.averageRating.toFixed(1)
                    : "0.0"}
                </div>
                <StarRating
                  rating={stats?.averageRating || 0}
                  readonly
                  size="sm"
                />
              </div>
            )}
            <p className="text-xs text-muted-foreground">Out of 5 stars</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Recent Reviews
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold">
                {stats?.recentReviews || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Rating</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold">
                {stats?.ratingDistribution?.[5] || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">5-star reviews</p>
          </CardContent>
        </Card>
      </div>

      {/* Rating Distribution */}
      {stats && stats.totalReviews > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = stats.ratingDistribution[rating] || 0;
                const percentage =
                  stats.totalReviews > 0
                    ? (count / stats.totalReviews) * 100
                    : 0;

                return (
                  <div key={rating} className="flex items-center gap-4">
                    <div className="flex items-center gap-1 w-16">
                      <span className="text-sm font-medium">{rating}</span>
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    </div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="text-sm text-gray-600 w-12 text-right">
                      {count}
                    </div>
                    <div className="text-sm text-gray-500 w-12 text-right">
                      {percentage.toFixed(0)}%
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <ReviewsTable />
        </CardContent>
      </Card>
    </div>
  );
}
