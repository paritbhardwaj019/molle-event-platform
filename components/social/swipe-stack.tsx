"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import TinderCard from "react-tinder-card";
import { SwipeCard } from "./swipe-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PurchaseSwipesDialog } from "./purchase-swipes-dialog";
import {
  Loader2,
  Sparkles,
  ShoppingCart,
  AlertCircle,
  RotateCcw,
  Users,
  Heart,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface UserProfile {
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
  interestScore?: number;
  sharedInterests?: string[];
  likeCount?: number;
  hasBadge?: boolean;
  photos: string[];
  gender?: string;
}

interface SwipeInfo {
  swipesUsed: number;
  dailyLimit: number;
  remaining: number;
}

interface SwipeStackProps {
  users: UserProfile[];
  onSwipe: (
    userId: string,
    action: "LIKE" | "PASS"
  ) => Promise<{ isMatch?: boolean; swipeInfo?: SwipeInfo; error?: string }>;
  onLoadMore: () => void;
  isLoading: boolean;
  hasMore: boolean;
  swipeInfo: SwipeInfo;
  onPurchaseSwipes?: (swipeCount: number) => Promise<void>;
  dailyLimitExceeded?: boolean;
  noUsersFound?: boolean;
  pricingTiers?: any[];
}

export function SwipeStack({
  users,
  onSwipe,
  onLoadMore,
  isLoading,
  hasMore,
  swipeInfo,
  onPurchaseSwipes,
  dailyLimitExceeded = false,
  noUsersFound = false,
  pricingTiers = [],
}: SwipeStackProps) {
  const [currentUsers, setCurrentUsers] = useState<UserProfile[]>([]);
  const [isProcessingSwipe, setIsProcessingSwipe] = useState(false);
  const [currentSwipeInfo, setCurrentSwipeInfo] = useState(swipeInfo);
  const [matches, setMatches] = useState<string[]>([]);
  const [swipedUsers, setSwipedUsers] = useState<string[]>([]);
  const tinderCardRefs = useRef<{ [key: string]: any }>({});

  useEffect(() => {
    // Sort users by like count (highest first), then by interest score (highest first)
    const sortedUsers = users
      .sort((a, b) => {
        // Primary sort: by like count (descending)
        const aLikes = a.likeCount || 0;
        const bLikes = b.likeCount || 0;
        if (bLikes !== aLikes) {
          return bLikes - aLikes;
        }
        // Secondary sort: by interest score (descending)
        const aScore = a.interestScore || 0;
        const bScore = b.interestScore || 0;
        return bScore - aScore;
      })
      .slice(0, 5);

    setCurrentUsers(sortedUsers);
  }, [users]);

  useEffect(() => {
    setCurrentSwipeInfo(swipeInfo);
  }, [swipeInfo]);

  const onSwipeHandler = useCallback(
    async (direction: string, swipedUserId: string) => {
      if (isProcessingSwipe) return;

      setIsProcessingSwipe(true);

      try {
        const action = direction === "right" ? "LIKE" : "PASS";
        const result = await onSwipe(swipedUserId, action);

        if (result.error) {
          toast.error(result.error);
          return;
        }

        if (result.swipeInfo) {
          setCurrentSwipeInfo(result.swipeInfo);
        }

        if (result.isMatch) {
          setMatches((prev) => [...prev, swipedUserId]);
          toast.success("🎉 It's a match!", {
            description: "You can now start chatting!",
            duration: 3000,
          });
        }

        setSwipedUsers((prev) => [...prev, swipedUserId]);

        if (currentUsers.length <= 3 && hasMore && !isLoading) {
          onLoadMore();
        }
      } catch (error) {
        toast.error("Failed to process swipe. Please try again.");
        console.error("Swipe error:", error);
      } finally {
        setIsProcessingSwipe(false);
      }
    },
    [
      isProcessingSwipe,
      onSwipe,
      currentUsers.length,
      hasMore,
      isLoading,
      onLoadMore,
    ]
  );

  const onCardLeftScreen = useCallback(
    (direction: string, swipedUserId: string) => {
      setCurrentUsers((prev) => {
        const filtered = prev.filter((user) => user.id !== swipedUserId);

        const nextUserIndex =
          users.findIndex((user) => user.id === swipedUserId) + 1;
        const remainingUsers = users.slice(nextUserIndex + 4);

        if (remainingUsers.length > 0 && filtered.length < 5) {
          const sortedRemaining = remainingUsers.sort((a, b) => {
            const aLikes = a.likeCount || 0;
            const bLikes = b.likeCount || 0;
            if (bLikes !== aLikes) {
              return bLikes - aLikes;
            }
            const aScore = a.interestScore || 0;
            const bScore = b.interestScore || 0;
            return bScore - aScore;
          });

          filtered.push(sortedRemaining[0]);
        }

        return filtered;
      });
    },
    [users]
  );

  const handleSwipeButton = useCallback(
    async (direction: "left" | "right") => {
      if (currentUsers.length === 0 || isProcessingSwipe) return;

      const topCard = currentUsers[0];
      if (tinderCardRefs.current[topCard.id]) {
        await tinderCardRefs.current[topCard.id].swipe(direction);
      }
    },
    [currentUsers, isProcessingSwipe]
  );

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      onLoadMore();
    }
  };

  // No users available
  if (currentUsers.length === 0 && !isLoading) {
    return (
      <div className="h-[600px] flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center space-y-4">
            {currentSwipeInfo.remaining <= 0 ? (
              <>
                <div className="w-16 h-16 mx-auto bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Daily Limit Reached
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    You've used all {currentSwipeInfo.dailyLimit} of your daily
                    swipes.
                  </p>
                </div>
                {onPurchaseSwipes && pricingTiers.length > 0 && (
                  <PurchaseSwipesDialog
                    onPurchase={onPurchaseSwipes}
                    pricingTiers={pricingTiers}
                  />
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Come back tomorrow for more free swipes!
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    No More Profiles
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    You've seen everyone in your area. Check back later for new
                    people!
                  </p>
                </div>
                {hasMore && (
                  <Button
                    onClick={handleLoadMore}
                    variant="outline"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    Load More
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {matches.length > 0 && (
        <div className="flex justify-center">
          <Badge
            variant="default"
            className="px-4 py-2 text-sm bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
          >
            {matches.length} matches
          </Badge>
        </div>
      )}

      {/* Card Stack with improved mobile touch handling */}
      <div className="relative h-[600px] max-w-md mx-auto overflow-hidden">
        {isLoading && currentUsers.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Card className="w-full h-full">
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center space-y-4">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Finding people with shared interests...
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : dailyLimitExceeded ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Card className="w-full h-full">
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto">
                    <ShoppingCart className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Daily Swipe Limit Reached
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    You've used all your daily swipes. Get more swipes to
                    continue discovering people!
                  </p>
                  {onPurchaseSwipes && pricingTiers.length > 0 && (
                    <PurchaseSwipesDialog
                      onPurchase={onPurchaseSwipes}
                      pricingTiers={pricingTiers}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : noUsersFound && !isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Card className="w-full h-full">
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    No People Found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    No people match your current preferences in this area. Try
                    adjusting your preferences or check back later!
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div
            className="relative w-full h-full touch-pan-y"
            style={{ touchAction: "pan-y" }}
          >
            {currentUsers.map((user, index) => (
              <div
                key={user.id}
                className="absolute inset-0 touch-manipulation"
                style={{
                  zIndex: currentUsers.length - index,
                }}
              >
                <TinderCard
                  ref={(el) => {
                    if (el) tinderCardRefs.current[user.id] = el;
                  }}
                  onSwipe={(direction) => onSwipeHandler(direction, user.id)}
                  onCardLeftScreen={(direction) =>
                    onCardLeftScreen(direction, user.id)
                  }
                  preventSwipe={["up", "down"]}
                  swipeRequirementType="position"
                  swipeThreshold={100}
                  className="w-full h-full"
                >
                  <div
                    className="w-full h-full select-none"
                    style={{
                      scale: 1 - index * 0.02,
                      opacity: 1 - index * 0.1,
                      touchAction: "none",
                    }}
                  >
                    <SwipeCard
                      user={user}
                      onSwipe={() => {}}
                      isTop={index === 0}
                    />
                  </div>
                </TinderCard>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enhanced Swipe Buttons with better mobile accessibility */}
      {currentUsers.length > 0 && !dailyLimitExceeded && !noUsersFound && (
        <div className="flex justify-center space-x-6">
          <Button
            onClick={() => handleSwipeButton("left")}
            disabled={isProcessingSwipe}
            variant="outline"
            size="lg"
            className="w-16 h-16 rounded-full border-2 border-red-300 hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-950 active:scale-95 transition-all duration-200 touch-manipulation"
            style={{ touchAction: "manipulation" }}
            aria-label="Pass on this profile"
          >
            <X className="w-8 h-8 text-red-500" />
          </Button>

          <Button
            onClick={() => handleSwipeButton("right")}
            disabled={isProcessingSwipe}
            variant="outline"
            size="lg"
            className="w-16 h-16 rounded-full border-2 border-green-300 hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-950 active:scale-95 transition-all duration-200 touch-manipulation"
            style={{ touchAction: "manipulation" }}
            aria-label="Like this profile"
          >
            <Heart className="w-8 h-8 text-green-500" />
          </Button>
        </div>
      )}

      {currentUsers.length > 0 && hasMore && (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            onClick={handleLoadMore}
            disabled={isLoading}
            className="text-gray-600 dark:text-gray-400 touch-manipulation"
            style={{ touchAction: "manipulation" }}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading more...
              </>
            ) : (
              "Load more profiles"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
