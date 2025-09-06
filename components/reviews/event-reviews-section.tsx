"use client";

import { useEffect, useState } from "react";
import { ReviewForm } from "./review-form";
import { ReviewsList } from "./reviews-list";
import {
  canUserReviewEvent,
  getUserReviewForEvent,
} from "@/lib/actions/review";
import { useLoggedInUser } from "@/lib/hooks/use-logged-in-user";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Review } from "@/lib/actions/review";

interface EventReviewsSectionProps {
  eventId: string;
}

export function EventReviewsSection({ eventId }: EventReviewsSectionProps) {
  const { isAuthenticated, user } = useLoggedInUser();
  const [canReview, setCanReview] = useState(false);
  const [reviewReason, setReviewReason] = useState<string | null>(null);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const checkReviewEligibility = async () => {
    if (!isAuthenticated || !user) {
      setIsLoading(false);
      return;
    }

    try {
      const [eligibilityResult, userReviewResult] = await Promise.all([
        canUserReviewEvent(eventId),
        getUserReviewForEvent(eventId),
      ]);

      if (eligibilityResult.success && eligibilityResult.data) {
        setCanReview(eligibilityResult.data.canReview);
        setReviewReason(eligibilityResult.data.reason);
      }

      if (userReviewResult.success && userReviewResult.data) {
        setUserReview(userReviewResult.data);
      }
    } catch (error) {
      console.error("Error checking review eligibility:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkReviewEligibility();
  }, [eventId, isAuthenticated, user]);

  const handleReviewSubmitted = () => {
    setRefreshTrigger((prev) => prev + 1);
    checkReviewEligibility(); // Refresh eligibility status
  };

  return (
    <div className="space-y-8">
      {/* User's Review Status */}
      {isAuthenticated && !isLoading && (
        <div>
          {userReview ? (
            <Card className="bg-green-900/20 border-green-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium mb-1">Your Review</h3>
                    <p className="text-green-300 text-sm">
                      Thank you for reviewing this event!
                    </p>
                  </div>
                  <Badge className="bg-green-600 text-white">Reviewed</Badge>
                </div>
              </CardContent>
            </Card>
          ) : canReview ? (
            <ReviewForm
              eventId={eventId}
              onReviewSubmitted={handleReviewSubmitted}
            />
          ) : reviewReason ? (
            <Card className="bg-gray-800/30 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium mb-1">
                      Review Status
                    </h3>
                    <p className="text-gray-400 text-sm">{reviewReason}</p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-gray-700 text-gray-300"
                  >
                    Not Eligible
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}

      {/* Reviews List */}
      <div>
        <ReviewsList eventId={eventId} refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
}
