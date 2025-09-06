"use client";

import { useState, useEffect } from "react";
import { SwipeStack } from "./swipe-stack";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, Heart, Lock, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { PurchaseSwipesDialog } from "./purchase-swipes-dialog";

interface UnreadLike {
  id: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
    age?: number;
    bio?: string;
    interests: string[];
    connectionTypes: string[];
    relationshipStatus?: string;
    showLocation?: boolean;
    cityId?: string;
    hasBadge?: boolean;
    photos: string[];
  };
}

interface UnreadLikesSectionProps {
  onSwipe: (
    userId: string,
    action: "LIKE" | "PASS"
  ) => Promise<{ isMatch?: boolean; error?: string }>;
  pricingTiers?: any[];
  onPurchaseSwipes?: (swipeCount: number) => Promise<void>;
}

export function UnreadLikesSection({
  onSwipe,
  pricingTiers = [],
  onPurchaseSwipes,
}: UnreadLikesSectionProps) {
  const [unreadLikes, setUnreadLikes] = useState<UnreadLike[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requiresUpgrade, setRequiresUpgrade] = useState(false);

  const fetchUnreadLikes = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/social/unread-likes");
      const data = await response.json();

      if (data.success) {
        setUnreadLikes(data.data);
        setRequiresUpgrade(false);
      } else {
        if (data.requiresUpgrade) {
          setRequiresUpgrade(true);
        } else {
          setError(data.error || "Failed to load unread likes");
        }
      }
    } catch (error) {
      console.error("Failed to fetch unread likes:", error);
      setError("Failed to load unread likes");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadLikes();
  }, []);

  const handleSwipe = async (userId: string, action: "LIKE" | "PASS") => {
    try {
      const result = await onSwipe(userId, action);

      if (result.error) {
        toast.error(result.error);
        return result;
      }

      // Remove the swiped user from unread likes
      setUnreadLikes((prev) => prev.filter((like) => like.user.id !== userId));

      if (result.isMatch) {
        toast.success("🎉 It's a match!", {
          description: "You can now start chatting!",
          duration: 3000,
        });
      }

      return result;
    } catch (error) {
      toast.error("Failed to process swipe. Please try again.");
      return { error: "Failed to process swipe" };
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Heart className="w-5 h-5 text-pink-500" />
            <span>See Who Liked You</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Loading...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (requiresUpgrade) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lock className="w-5 h-5 text-gray-500" />
            <span>See Who Liked You</span>
            <Badge variant="secondary" className="ml-2">
              Premium
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 mx-auto bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                See Who Liked You
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Upgrade to a premium package to see who has liked your profile
                and swipe back!
              </p>
            </div>
            {onPurchaseSwipes && pricingTiers.length > 0 && (
              <PurchaseSwipesDialog
                onPurchase={onPurchaseSwipes}
                pricingTiers={pricingTiers}
              />
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Heart className="w-5 h-5 text-pink-500" />
            <span>See Who Liked You</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Button onClick={fetchUnreadLikes} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (unreadLikes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Heart className="w-5 h-5 text-pink-500" />
            <span>See Who Liked You</span>
            <Badge variant="secondary" className="ml-2">
              {unreadLikes.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Likes Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                When someone likes your profile, they'll appear here for you to
                swipe back!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Heart className="w-5 h-5 text-pink-500" />
          <span>See Who Liked You</span>
          <Badge variant="secondary" className="ml-2">
            {unreadLikes.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            These people liked your profile! Swipe right to match or left to
            pass.
          </p>
          <SwipeStack
            users={unreadLikes.map((like) => like.user)}
            onSwipe={handleSwipe}
            onLoadMore={() => {}}
            isLoading={false}
            hasMore={false}
            swipeInfo={{
              swipesUsed: 0,
              dailyLimit: 999,
              remaining: 999,
            }}
            dailyLimitExceeded={false}
            noUsersFound={false}
          />
        </div>
      </CardContent>
    </Card>
  );
}
