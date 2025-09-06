"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus } from "lucide-react";
import { toast } from "sonner";
import {
  followHost,
  unfollowHost,
  isFollowingHost,
} from "@/lib/actions/follow";
import { useLoggedInUser } from "@/lib/hooks/use-logged-in-user";

interface FollowButtonProps {
  hostId: string;
  hostName: string;
  className?: string;
  onFollowChange?: (isFollowing: boolean) => void;
}

export function FollowButton({
  hostId,
  hostName,
  className,
  onFollowChange,
}: FollowButtonProps) {
  const { isAuthenticated, user } = useLoggedInUser();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  useEffect(() => {
    async function checkFollowStatus() {
      if (!isAuthenticated || !user) {
        setIsCheckingStatus(false);
        return;
      }

      try {
        const result = await isFollowingHost(hostId);
        if (result.success && result.data) {
          setIsFollowing(result.data.isFollowing);
        }
      } catch (error) {
        console.error("Error checking follow status:", error);
      } finally {
        setIsCheckingStatus(false);
      }
    }

    checkFollowStatus();
  }, [isAuthenticated, user, hostId]);

  const handleFollowToggle = async () => {
    if (!isAuthenticated || !user) {
      toast.error("Please log in to follow hosts");
      return;
    }

    if (user.id === hostId) {
      toast.error("You cannot follow yourself");
      return;
    }

    setIsLoading(true);

    try {
      const result = isFollowing
        ? await unfollowHost(hostId)
        : await followHost(hostId);

      if (result.success) {
        const newFollowState = !isFollowing;
        setIsFollowing(newFollowState);

        // Notify parent component about the change
        if (onFollowChange) {
          onFollowChange(newFollowState);
        }

        toast.success(
          result.message ||
            (isFollowing ? "Unfollowed successfully" : "Following successfully")
        );
      } else {
        toast.error(result.error || "Something went wrong");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show button if user is not authenticated or is the host themselves
  if (!isAuthenticated || !user || user.id === hostId) {
    return null;
  }

  // Show loading state while checking follow status
  if (isCheckingStatus) {
    return (
      <Button variant="outline" size="sm" disabled className={className}>
        <UserPlus className="w-4 h-4 mr-2" />
        Loading...
      </Button>
    );
  }

  return (
    <Button
      variant={isFollowing ? "outline" : "default"}
      size="sm"
      onClick={handleFollowToggle}
      disabled={isLoading}
      className={className}
    >
      {isFollowing ? (
        <>
          <UserMinus className="w-4 h-4 mr-2" />
          {isLoading ? "Unfollowing..." : "Unfollow"}
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4 mr-2" />
          {isLoading ? "Following..." : "Follow"}
        </>
      )}
    </Button>
  );
}
