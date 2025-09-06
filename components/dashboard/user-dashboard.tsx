"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Heart,
  MessageCircle,
  Shield,
  Crown,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Star,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { toast } from "sonner";
import { DatingKycForm } from "@/components/kyc/dating-kyc-form";
import { PackagesPopup } from "@/components/social/packages-popup";
import {
  getMyDatingKyc,
  getLikesReceived,
  getMatches,
} from "@/lib/actions/dating";
import {
  getUserSubscriptionStatus,
  getAvailablePackages,
} from "@/lib/actions/package";

interface UserDashboardProps {
  metrics?: any;
}

interface DatingKycRequest {
  id: string;
  status: "NOT_STARTED" | "PENDING" | "APPROVED" | "REJECTED";
  docType: "AADHAAR" | "PASSPORT" | "DRIVING_LICENSE";
  createdAt: string;
  updatedAt: string;
  reason?: string;
  reviewedAt?: string;
}

interface Like {
  id: string;
  liker: {
    id: string;
    name: string;
    avatar?: string;
    age?: number;
  };
  createdAt: string;
}

interface Match {
  id: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
    age?: number;
  };
  createdAt: string;
  conversationId?: string;
}

export function UserDashboard({ metrics }: UserDashboardProps) {
  const [kycRequest, setKycRequest] = useState<DatingKycRequest | null>(null);
  const [likes, setLikes] = useState<Like[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showKycForm, setShowKycForm] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  const [availablePackages, setAvailablePackages] = useState<any[]>([]);
  const [showPackagesPopup, setShowPackagesPopup] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch KYC status
        const kycResult = await getMyDatingKyc();
        if (kycResult.success) {
          setKycRequest(kycResult.data);
        }

        // Fetch subscription status
        const subscriptionResult = await getUserSubscriptionStatus();
        if (subscriptionResult.success) {
          setSubscriptionStatus(subscriptionResult.data);
          setIsPremium(subscriptionResult.data.hasActiveSubscription);
        }

        // Fetch likes received (premium-gated)
        const likesResult = await getLikesReceived();
        if (likesResult.success) {
          setLikes(likesResult.data.likes || []);
        }

        // Fetch matches
        const matchesResult = await getMatches();
        if (matchesResult.success) {
          setMatches(matchesResult.data || []);
        }

        // Fetch available packages
        const packagesResult = await getAvailablePackages();
        if (packagesResult.success) {
          setAvailablePackages(packagesResult.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleKycSubmitted = () => {
    setShowKycForm(false);
    // Refresh KYC data
    getMyDatingKyc().then((result) => {
      if (result.success) {
        setKycRequest(result.data);
      }
    });
  };

  const handlePurchaseSuccess = () => {
    setShowPackagesPopup(false);
    // Refresh subscription data
    getUserSubscriptionStatus().then((result) => {
      if (result.success) {
        setSubscriptionStatus(result.data);
        setIsPremium(result.data.hasActiveSubscription);
      }
    });
  };

  const getKycStatusBadge = (status: string) => {
    switch (status) {
      case "NOT_STARTED":
        return (
          <Badge variant="outline" className="text-gray-600">
            Not Started
          </Badge>
        );
      case "PENDING":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Pending Review
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Approved
          </Badge>
        );
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getKycStatusIcon = (status: string) => {
    switch (status) {
      case "NOT_STARTED":
        return <Shield className="h-5 w-5 text-gray-400" />;
      case "PENDING":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "APPROVED":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "REJECTED":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Shield className="h-5 w-5 text-gray-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KYC Status Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-600" />
            Dating KYC Verification
          </CardTitle>
          <CardDescription>
            Complete KYC verification to unlock dating features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {kycRequest ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getKycStatusIcon(kycRequest.status)}
                <div>
                  <p className="font-medium">KYC Status</p>
                  <p className="text-sm text-gray-600">
                    {kycRequest.status === "APPROVED" && kycRequest.reviewedAt
                      ? `Approved on ${format(
                          new Date(kycRequest.reviewedAt),
                          "MMM d, yyyy"
                        )}`
                      : kycRequest.status === "REJECTED" && kycRequest.reason
                      ? `Rejected: ${kycRequest.reason}`
                      : `Submitted on ${format(
                          new Date(kycRequest.createdAt),
                          "MMM d, yyyy"
                        )}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getKycStatusBadge(kycRequest.status)}
                {(kycRequest.status === "NOT_STARTED" ||
                  kycRequest.status === "REJECTED") && (
                  <Button
                    onClick={() => setShowKycForm(true)}
                    variant="outline"
                    size="sm"
                  >
                    {kycRequest.status === "REJECTED"
                      ? "Resubmit"
                      : "Submit KYC"}
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No KYC submission found</p>
              <Button onClick={() => setShowKycForm(true)}>
                Submit KYC Verification
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Likes Received Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-600" />
            Likes Received
            {!isPremium && <Crown className="h-4 w-4 text-yellow-500" />}
          </CardTitle>
          <CardDescription>
            {isPremium
              ? "People who have liked your profile"
              : "Upgrade to Premium to see who liked you"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isPremium ? (
            likes.length > 0 ? (
              <div className="space-y-3">
                {likes.slice(0, 5).map((like) => (
                  <div
                    key={like.id}
                    className="flex items-center gap-3 p-3 rounded-lg border"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={like.liker.avatar} />
                      <AvatarFallback>
                        {like.liker.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{like.liker.name}</p>
                      <p className="text-sm text-gray-600">
                        Liked {format(new Date(like.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Heart className="h-4 w-4 mr-1" />
                      Like Back
                    </Button>
                  </div>
                ))}
                {likes.length > 5 && (
                  <p className="text-sm text-gray-600 text-center">
                    +{likes.length - 5} more likes
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No likes yet</p>
                <p className="text-sm text-gray-500 mt-1">
                  Keep swiping to get more likes!
                </p>
              </div>
            )
          ) : (
            <div className="text-center py-6">
              <div className="flex justify-center mb-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="relative -ml-2 first:ml-0">
                    <Avatar className="h-12 w-12 border-2 border-white">
                      <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center">
                        <EyeOff className="h-6 w-6 text-gray-400" />
                      </div>
                    </Avatar>
                  </div>
                ))}
              </div>
              <p className="font-medium mb-2">Upgrade to Premium</p>
              <p className="text-sm text-gray-600 mb-4">
                See who liked your profile and get more features
              </p>
              <Button>
                <Crown className="h-4 w-4 mr-2" />
                Upgrade Now
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Matches Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-600" />
            Your Matches
          </CardTitle>
          <CardDescription>People you've matched with</CardDescription>
        </CardHeader>
        <CardContent>
          {matches.length > 0 ? (
            <div className="space-y-3">
              {matches.slice(0, 5).map((match) => (
                <div
                  key={match.id}
                  className="flex items-center gap-3 p-3 rounded-lg border"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={match.user.avatar} />
                    <AvatarFallback>
                      {match.user.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{match.user.name}</p>
                    <p className="text-sm text-gray-600">
                      Matched {format(new Date(match.createdAt), "MMM d, yyyy")}
                    </p>
                  </div>
                  <Button asChild size="sm">
                    <Link href={`/dashboard/social/chat?match=${match.id}`}>
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Chat
                    </Link>
                  </Button>
                </div>
              ))}
              {matches.length > 5 && (
                <p className="text-sm text-gray-600 text-center">
                  +{matches.length - 5} more matches
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No matches yet</p>
              <p className="text-sm text-gray-500 mt-1">
                Start swiping to find matches!
              </p>
              <Button asChild className="mt-3">
                <Link href="/dashboard/social/discover">
                  <Heart className="h-4 w-4 mr-2" />
                  Start Discovering
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscription Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-600" />
            Subscription Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscriptionStatus?.hasActiveSubscription ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Current Plan</span>
                <Badge
                  variant="default"
                  className="bg-yellow-100 text-yellow-800"
                >
                  {subscriptionStatus.activePackage?.name || "Premium"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Daily Swipes</span>
                <span className="font-semibold">
                  {subscriptionStatus.dailySwipeRemaining} remaining
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Valid Until</span>
                <span className="font-semibold">
                  {subscriptionStatus.subscriptionEndDate
                    ? format(
                        new Date(subscriptionStatus.subscriptionEndDate),
                        "MMM d, yyyy"
                      )
                    : "Lifetime"}
                </span>
              </div>
              {subscriptionStatus.activePackage && (
                <div className="pt-3 border-t">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Plan Features:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {subscriptionStatus.activePackage.allowBadge && (
                      <Badge variant="secondary" className="text-xs">
                        <Crown className="h-3 w-3 mr-1" />
                        Gold Badge
                      </Badge>
                    )}
                    {subscriptionStatus.activePackage.canSeeLikes && (
                      <Badge variant="secondary" className="text-xs">
                        <Eye className="h-3 w-3 mr-1" />
                        See Likes
                      </Badge>
                    )}
                    {subscriptionStatus.activePackage.priorityMatching && (
                      <Badge variant="secondary" className="text-xs">
                        <Star className="h-3 w-3 mr-1" />
                        Priority Matching
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <Crown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No active subscription</p>
              <Button onClick={() => setShowPackagesPopup(true)}>
                <Crown className="h-4 w-4 mr-2" />
                Upgrade Now
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/dashboard/social/discover">
                <Heart className="h-4 w-4 mr-2" />
                Discover People
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/social/chat">
                <MessageCircle className="h-4 w-4 mr-2" />
                View All Chats
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/bookings">
                <Calendar className="h-4 w-4 mr-2" />
                My Bookings
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profile Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Likes</span>
              <span className="font-semibold">{likes.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Matches</span>
              <span className="font-semibold">{matches.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">KYC Status</span>
              <span className="font-semibold">
                {kycRequest?.status === "APPROVED"
                  ? "Verified"
                  : "Not Verified"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KYC Form Dialog */}
      {showKycForm && (
        <DatingKycForm
          open={showKycForm}
          onOpenChange={setShowKycForm}
          onSuccess={handleKycSubmitted}
          existingRequest={kycRequest}
        />
      )}

      {/* Packages Popup */}
      <PackagesPopup
        open={showPackagesPopup}
        onOpenChange={setShowPackagesPopup}
        onPurchaseSuccess={handlePurchaseSuccess}
      />
    </div>
  );
}
