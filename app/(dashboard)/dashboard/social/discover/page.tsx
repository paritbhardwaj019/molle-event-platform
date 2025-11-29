"use client";

import { useState, useEffect, useCallback } from "react";
import { useLoggedInUser } from "@/lib/hooks/use-logged-in-user";
import { SwipeStack } from "@/components/social/swipe-stack";
import { PurchaseSwipesDialog } from "@/components/social/purchase-swipes-dialog";
import { PackagesPopup } from "@/components/social/packages-popup";
import { UnreadLikesSection } from "@/components/social/unread-likes-section";
import { ProfilePhotosUpload } from "@/components/profile/profile-photos-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Settings,
  MapPin,
  Heart,
  Users,
  Briefcase,
  Coffee,
  Loader2,
  Plus,
  X,
  Zap,
  Crown,
  Shield,
  Eye,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { CitySearch } from "@/components/ui/city-search";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { getUserSubscriptionStatus } from "@/lib/actions/package";
import { getMyDatingKyc, likeUser } from "@/lib/actions/dating";
import { KycVerificationDialog } from "@/components/social/kyc-verification-dialog";

interface UserProfile {
  id: string;
  name: string;
  avatar?: string;
  age?: number;
  bio?: string;
  interests: string[];
  photos: string[];
  connectionTypes: string[];
  relationshipStatus?: string;
  showLocation?: boolean;
  cityId?: string;
  interestScore?: number;
  sharedInterests?: string[];
  likeCount?: number;
  gender?: string;
}

interface SwipeInfo {
  swipesUsed: number;
  dailyLimit: number;
  remaining: number;
}

interface UserPreferences {
  cityId?: string;
  maxDistance: number;
  connectionTypes: string[];
  relationshipStatus?: string;
  ageRange?: { min: number; max: number };
  interests: string[];
  photos: string[];
  showAge: boolean;
  showLocation: boolean;
  discoverable: boolean;
  bio?: string;
  age?: number;
  gender?: string;
}

const connectionTypeOptions = [
  { value: "FRIENDS", label: "Friends", icon: Users, color: "blue" },
  { value: "DATING", label: "Dating", icon: Heart, color: "pink" },
  {
    value: "NETWORKING",
    label: "Networking",
    icon: Briefcase,
    color: "purple",
  },
  { value: "HANGOUT", label: "Hangout", icon: Coffee, color: "green" },
];

const relationshipOptions = [
  { value: "SINGLE", label: "Single" },
  { value: "TAKEN", label: "Taken" },
  { value: "COMPLICATED", label: "It's Complicated" },
  { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
];

const genderOptions = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "NON_BINARY", label: "Non-binary" },
  { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
];

const popularInterests = [
  "Houseparties",
  "Concerts",
  "Clubbing",
  "Nightlife",
  "Dancing",
  "Live Music",
  "DJ Sets",
  "Bar Hopping",
  "Pub Crawls",
  "Festivals",
  "Rooftop Parties",
  "Beach Parties",
  "Pool Parties",
  "Karaoke Nights",
  "Wine Tasting",
  "Cocktail Bars",
  "Jazz Clubs",
  "Electronic Music",
  "Rock Concerts",
  "Hip Hop Nights",
  "Latin Dancing",
  "Bollywood Nights",
  "EDM Festivals",
  "Music Festivals",
  "Weekend Getaways",
  "Party Planning",
  "Event Hosting",
  "Social Gatherings",
  "Networking Events",
  "Birthday Celebrations",
];

export default function SocialDiscoverPage() {
  const { user } = useLoggedInUser();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [swipeInfo, setSwipeInfo] = useState<SwipeInfo>({
    swipesUsed: 0,
    dailyLimit: 3,
    remaining: 3,
  });
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [showPreferences, setShowPreferences] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [newInterest, setNewInterest] = useState("");
  const [pricingTiers, setPricingTiers] = useState<any[]>([]);
  const [dailyLimitExceeded, setDailyLimitExceeded] = useState(false);
  const [noUsersFound, setNoUsersFound] = useState(false);
  const [isPreferencesLoading, setIsPreferencesLoading] = useState(true);
  const [showPackagesPopup, setShowPackagesPopup] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [isKycLoading, setIsKycLoading] = useState(false);
  const [dialogPreferences, setDialogPreferences] =
    useState<UserPreferences | null>(null);
  const [dialogNewInterest, setDialogNewInterest] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showKycDialog, setShowKycDialog] = useState(false);
  const [pendingSwipeAction, setPendingSwipeAction] = useState<
    (() => void) | null
  >(null);

  // Fetch user preferences
  const fetchPreferences = useCallback(async () => {
    setIsPreferencesLoading(true);
    try {
      const response = await fetch("/api/social/preferences");
      const data = await response.json();

      if (data.success) {
        setPreferences(data.data);
        const isComplete =
          data.data.connectionTypes?.length > 0 &&
          data.data.discoverable &&
          data.data.cityId;

        setIsSetupComplete(isComplete);
      }
    } catch (error) {
      console.error("Failed to fetch preferences:", error);
    } finally {
      setIsPreferencesLoading(false);
    }
  }, []);

  // Fetch subscription status
  const fetchSubscriptionStatus = useCallback(async () => {
    try {
      const result = await getUserSubscriptionStatus();
      if (result.success) {
        setSubscriptionStatus(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch subscription status:", error);
    }
  }, []);

  // Fetch KYC status (optional)
  const fetchKycStatus = useCallback(async () => {
    setIsKycLoading(true);
    try {
      const result = await getMyDatingKyc();
      if (result.success) {
        setKycStatus(result.data?.status || "NOT_STARTED");
      }
    } catch (error) {
      console.error("Failed to fetch KYC status:", error);
      // Don't block the user experience if KYC fetch fails
      setKycStatus("NOT_STARTED");
    } finally {
      setIsKycLoading(false);
    }
  }, []);

  // Fetch nearby users
  const fetchUsers = useCallback(
    async (reset = false) => {
      if (isLoading || !isSetupComplete) return;

      setIsLoading(true);
      try {
        const currentOffset = reset ? 0 : offset;
        const response = await fetch(
          `/api/social/discover?limit=10&offset=${currentOffset}`
        );
        const data = await response.json();

        setIsLoading(false);

        if (data.success) {
          if (reset) {
            setUsers(data.data);
            setOffset(10);
          } else {
            setUsers((prev) => [...prev, ...data.data]);
            setOffset((prev) => prev + 10);
          }
          setHasMore(data.pagination.hasMore);
          if (data.swipeInfo) {
            setSwipeInfo(data.swipeInfo);
          }

          setDailyLimitExceeded(false);
          setNoUsersFound(false);

          if (data.matchQuality && data.data.length > 0) {
            const avgScore = Math.round(data.matchQuality.averageScore);
            const withSharedInterests =
              data.matchQuality.totalWithSharedInterests;

            if (avgScore > 70) {
              toast.success(
                `Great matches found! Average compatibility: ${avgScore}%`
              );
            } else if (withSharedInterests > 0) {
              toast.info(
                `Found ${withSharedInterests} people with shared interests`
              );
            }
          }
        } else if (data.error === "Daily swipe limit reached") {
          setSwipeInfo({
            swipesUsed: data.swipesUsed,
            dailyLimit: data.dailyLimit,
            remaining: 0,
          });
          setDailyLimitExceeded(true);
          setNoUsersFound(false);
        } else if (data.error === "No users found") {
          setNoUsersFound(true);
          setDailyLimitExceeded(false);
        } else {
          toast.error(data.error || "Failed to load users");
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
        toast.error("Failed to load users");
      }
    },
    [isSetupComplete, offset]
  );

  // Handle swipe action
  const handleSwipe = useCallback(
    async (userId: string, action: "LIKE" | "PASS") => {
      try {
        // Check if user has active subscription and swipes remaining
        if (subscriptionStatus) {
          const totalRemaining = subscriptionStatus.hasActiveSubscription
            ? subscriptionStatus.dailySwipeRemaining +
              subscriptionStatus.freeSwipesRemaining
            : subscriptionStatus.freeSwipesRemaining;

          if (totalRemaining <= 0) {
            setShowPackagesPopup(true);
            return { error: "No swipes remaining" };
          }
        }

        // Check KYC status for likes (dating connections)
        if (action === "LIKE" && kycStatus && kycStatus !== "APPROVED") {
          // Show KYC dialog for dating connections
          setPendingSwipeAction(() => () => performSwipe(userId, action));
          setShowKycDialog(true);
          return { error: "KYC dialog shown" };
        }

        return await performSwipe(userId, action);
      } catch (error) {
        console.error("Swipe failed:", error);
        return { error: "Failed to process swipe" };
      }
    },
    [subscriptionStatus, kycStatus]
  );

  // Perform the actual swipe action
  const performSwipe = async (userId: string, action: "LIKE" | "PASS") => {
    try {
      const response = await fetch("/api/social/swipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ swipedUserId: userId, action }),
      });

      const data = await response.json();

      if (data.success) {
        // Update local subscription status
        if (subscriptionStatus && data.data.swipeInfo) {
          setSubscriptionStatus((prev: any) => ({
            ...prev,
            dailySwipeRemaining: data.data.swipeInfo.hasActiveSubscription
              ? data.data.swipeInfo.remaining -
                data.data.swipeInfo.freeSwipesRemaining
              : 0,
            freeSwipesRemaining: data.data.swipeInfo.freeSwipesRemaining,
          }));
        }

        // If it's a like, also create a like record
        if (action === "LIKE") {
          const likeResult = await likeUser(userId);
          if (likeResult.success && likeResult.data?.isMatch) {
            return {
              isMatch: true,
              swipeInfo: data.data.swipeInfo,
            };
          }
        }

        return {
          isMatch: data.data.isMatch,
          swipeInfo: data.data.swipeInfo,
        };
      } else {
        return { error: data.error };
      }
    } catch (error) {
      console.error("Swipe failed:", error);
      return { error: "Failed to process swipe" };
    }
  };

  // Handle KYC dialog continue
  const handleKycDialogContinue = () => {
    if (pendingSwipeAction) {
      pendingSwipeAction();
      setPendingSwipeAction(null);
    }
  };

  // Update preferences
  const updatePreferences = async (
    newPreferences: Partial<UserPreferences>
  ) => {
    try {
      // Filter out null and undefined values and ensure proper types
      const cleanedPreferences = Object.fromEntries(
        Object.entries(newPreferences)
          .filter(
            ([_, value]) =>
              value !== null && value !== undefined && value !== ""
          )
          .map(([key, value]) => {
            // Ensure age is a number if it exists
            if (key === "age" && value !== undefined) {
              return [key, typeof value === "string" ? parseInt(value) : value];
            }
            return [key, value];
          })
      );

      const response = await fetch("/api/social/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanedPreferences),
      });

      const data = await response.json();

      if (data.success) {
        setPreferences(data.data);
        const isComplete =
          data.data.connectionTypes?.length > 0 &&
          data.data.discoverable &&
          data.data.cityId;

        setIsSetupComplete(isComplete);
        toast.success("Preferences updated!");
        setShowPreferences(false);

        if (isComplete) {
          fetchUsers(true);
        }
      } else {
        console.error("API Error:", data);
        if (data.details) {
          console.error("Validation details:", data.details);
          toast.error(
            `Validation error: ${data.details
              .map((e: any) => e.message)
              .join(", ")}`
          );
        } else {
          toast.error(data.error || "Failed to update preferences");
        }
      }
    } catch (error) {
      console.error("Failed to update preferences:", error);
      toast.error("Failed to update preferences");
    }
  };

  const addInterest = () => {
    if (
      newInterest.trim() &&
      preferences &&
      !preferences.interests.includes(newInterest.trim())
    ) {
      setPreferences((prev) =>
        prev
          ? {
              ...prev,
              interests: [...prev.interests, newInterest.trim()],
            }
          : null
      );
      setNewInterest("");
    }
  };

  const removeInterest = (interest: string) => {
    if (preferences) {
      setPreferences((prev) =>
        prev
          ? {
              ...prev,
              interests: prev.interests.filter((i) => i !== interest),
            }
          : null
      );
    }
  };

  const addDialogInterest = () => {
    if (
      dialogNewInterest.trim() &&
      dialogPreferences &&
      !dialogPreferences.interests.includes(dialogNewInterest.trim())
    ) {
      setDialogPreferences((prev) =>
        prev
          ? {
              ...prev,
              interests: [...prev.interests, dialogNewInterest.trim()],
            }
          : null
      );
      setDialogNewInterest("");
    }
  };

  const removeDialogInterest = (interest: string) => {
    if (dialogPreferences) {
      setDialogPreferences((prev) =>
        prev
          ? {
              ...prev,
              interests: prev.interests.filter((i) => i !== interest),
            }
          : null
      );
    }
  };

  const handlePreferencesDialogOpen = (open: boolean) => {
    setShowPreferences(open);
    if (open && preferences) {
      setDialogPreferences({ ...preferences });
      setDialogNewInterest("");
    }
  };

  const updateDialogPreferences = async () => {
    if (!dialogPreferences) return;

    try {
      // Filter out null and undefined values and ensure proper types
      const cleanedPreferences = Object.fromEntries(
        Object.entries(dialogPreferences)
          .filter(
            ([_, value]) =>
              value !== null && value !== undefined && value !== ""
          )
          .map(([key, value]) => {
            // Ensure age is a number if it exists
            if (key === "age" && value !== undefined) {
              return [key, typeof value === "string" ? parseInt(value) : value];
            }
            return [key, value];
          })
      );

      const response = await fetch("/api/social/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanedPreferences),
      });

      const data = await response.json();

      if (data.success) {
        setPreferences(data.data);
        setDialogPreferences(data.data);
        toast.success("Preferences updated successfully!");
        setShowPreferences(false);
      } else {
        console.error("API Error:", data);
        if (data.details) {
          console.error("Validation details:", data.details);
          toast.error(
            `Validation error: ${data.details
              .map((e: any) => e.message)
              .join(", ")}`
          );
        } else {
          toast.error(data.error || "Failed to update preferences");
        }
      }
    } catch (error) {
      console.error("Failed to update preferences:", error);
      toast.error("Failed to update preferences");
    }
  };

  const handlePurchaseSwipes = async (swipeCount: number) => {
    try {
      const purchaseResponse = await fetch("/api/social/purchase-swipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ swipeCount }),
      });

      const purchaseData = await purchaseResponse.json();

      if (!purchaseData.success) {
        toast.error(purchaseData.error || "Failed to create purchase order");
        return;
      }

      const paymentUrl =
        purchaseData.data.payment_links?.web ||
        purchaseData.data.payment_links?.mobile;

      if (!paymentUrl) {
        toast.error("Payment URL not found");
        return;
      }

      sessionStorage.setItem(
        "pendingCashfreeOrder",
        JSON.stringify({
          orderId: purchaseData.data.orderId,
          swipeCount: swipeCount,
          amount: purchaseData.data.amount,
        })
      );

      window.location.href = paymentUrl;
    } catch (error) {
      console.error("Purchase swipes error:", error);
      toast.error("Failed to initiate swipe purchase");
    }
  };

  const fetchPricingTiers = async () => {
    try {
      const response = await fetch("/api/social/purchase-swipes");
      const data = await response.json();

      if (data.success) {
        setPricingTiers(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch pricing tiers:", error);
    }
  };

  // Delete swipe profile
  const handleDeleteSwipeProfile = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch("/api/social/preferences", {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Swipe profile deleted successfully");
        setPreferences(null);
        setIsSetupComplete(false);
        setUsers([]);
        setShowDeleteConfirm(false);

        // Reset all related state
        setSwipeInfo({
          swipesUsed: 0,
          dailyLimit: 3,
          remaining: 3,
        });
        setOffset(0);
        setHasMore(true);
        setDailyLimitExceeded(false);
        setNoUsersFound(false);
      } else {
        toast.error(data.error || "Failed to delete swipe profile");
      }
    } catch (error) {
      console.error("Failed to delete swipe profile:", error);
      toast.error("Failed to delete swipe profile");
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPreferences();
      fetchPricingTiers();
      fetchSubscriptionStatus();
      fetchKycStatus();
    }
  }, [user, fetchPreferences, fetchSubscriptionStatus, fetchKycStatus]);

  useEffect(() => {
    if (isSetupComplete && users.length === 0) {
      fetchUsers(true);
    }
  }, [isSetupComplete, users.length, fetchUsers]);

  if (!user) {
    return <div>Loading...</div>;
  }

  // KYC status is now optional - show info but don't block
  if (
    !isKycLoading &&
    kycStatus &&
    kycStatus !== "APPROVED" &&
    kycStatus !== "NOT_STARTED"
  ) {
    return (
      <div className="px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Shield className="h-6 w-6 text-purple-600" />
                KYC Verification (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600">
                KYC verification helps ensure a safe and authentic dating
                experience, but it's not required to start discovering people.
              </p>

              {kycStatus === "PENDING" && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 font-medium">
                    Your KYC is under review
                  </p>
                  <p className="text-yellow-700 text-sm mt-1">
                    We'll notify you once your verification is complete (usually
                    within 24-48 hours).
                  </p>
                </div>
              )}

              {kycStatus === "REJECTED" && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 font-medium">
                    KYC verification was rejected
                  </p>
                  <p className="text-red-700 text-sm mt-1">
                    Please check your dashboard for details and resubmit your
                    verification.
                  </p>
                </div>
              )}

              <div className="flex space-x-3">
                <Button asChild className="flex-1">
                  <Link href="/dashboard">
                    <Shield className="h-4 w-4 mr-2" />
                    Complete KYC Verification
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsKycLoading(false)}
                >
                  Continue Without KYC
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show skeleton loading while preferences are being fetched
  if (isPreferencesLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-64" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-4 w-full" />

            {/* City Selection Skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-3 w-48" />
            </div>

            {/* Connection Types Skeleton */}
            <div className="space-y-3">
              <Skeleton className="h-4 w-32" />
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </div>

            {/* Bio Skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-24 w-full" />
            </div>

            {/* Interests Skeleton */}
            <div className="space-y-3">
              <Skeleton className="h-4 w-16" />
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-6 w-16" />
                ))}
              </div>
              <div className="flex space-x-2">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-10" />
              </div>
            </div>

            {/* Privacy Settings Skeleton */}
            <div className="space-y-4">
              <Skeleton className="h-4 w-24" />
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            </div>

            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isSetupComplete) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-purple-600" />
              Set Up Your Social Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-gray-600 dark:text-gray-400">
              Complete your profile to start discovering people near you.
            </p>

            {/* City Selection */}
            <div className="space-y-2">
              <Label>City</Label>
              <CitySearch
                variant="form"
                value={preferences?.cityId || ""}
                onValueChange={(cityName) => {
                  // Store city name as cityId for now
                  // This works since the API uses cityId for filtering
                  setPreferences((prev) =>
                    prev ? { ...prev, cityId: cityName } : null
                  );
                }}
                placeholder="Search and select your city"
                className="w-full"
              />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Choose your city to find people nearby
              </p>
            </div>

            {/* Connection Types */}
            <div className="space-y-3">
              <Label>What are you looking for?</Label>
              <div className="grid grid-cols-2 gap-3">
                {connectionTypeOptions.map((option) => {
                  const IconComponent = option.icon;
                  const isSelected = preferences?.connectionTypes?.includes(
                    option.value
                  );

                  return (
                    <div
                      key={option.value}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected
                          ? `border-${option.color}-500 bg-${option.color}-50 dark:bg-${option.color}-900/20`
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                      onClick={() => {
                        const currentTypes = preferences?.connectionTypes || [];
                        const newTypes = isSelected
                          ? currentTypes.filter((t) => t !== option.value)
                          : [...currentTypes, option.value];

                        setPreferences((prev) =>
                          prev ? { ...prev, connectionTypes: newTypes } : null
                        );
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <IconComponent
                          className={`w-5 h-5 text-${option.color}-600`}
                        />
                        <span className="font-medium">{option.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Age and Gender */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  min="18"
                  max="100"
                  placeholder="Enter your age"
                  value={preferences?.age?.toString() || ""}
                  onChange={(e) =>
                    setPreferences((prev) =>
                      prev
                        ? {
                            ...prev,
                            age: e.target.value
                              ? parseInt(e.target.value)
                              : undefined,
                          }
                        : null
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <select
                  id="gender"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={preferences?.gender || ""}
                  onChange={(e) =>
                    setPreferences((prev) =>
                      prev
                        ? { ...prev, gender: e.target.value || undefined }
                        : null
                    )
                  }
                >
                  <option value="">Select gender</option>
                  {genderOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">Bio (Optional)</Label>
              <Textarea
                id="bio"
                placeholder="Tell people a bit about yourself..."
                value={preferences?.bio || ""}
                onChange={(e) =>
                  setPreferences((prev) =>
                    prev ? { ...prev, bio: e.target.value } : null
                  )
                }
                maxLength={500}
              />
            </div>

            {/* Profile Photos */}
            <div className="space-y-3">
              <Label>Profile Photos</Label>
              <ProfilePhotosUpload
                currentPhotos={preferences?.photos || []}
                onPhotosChange={(photos) =>
                  setPreferences((prev) => (prev ? { ...prev, photos } : null))
                }
                disabled={false}
                maxPhotos={6}
              />
            </div>

            {/* Interests */}
            <div className="space-y-3">
              <Label>Interests</Label>
              <div className="flex flex-wrap gap-2 mb-3">
                {popularInterests.map((interest) => {
                  const isSelected = preferences?.interests?.includes(interest);
                  return (
                    <Badge
                      key={interest}
                      variant={isSelected ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        const currentInterests = preferences?.interests || [];
                        const newInterests = isSelected
                          ? currentInterests.filter((i) => i !== interest)
                          : [...currentInterests, interest];

                        setPreferences((prev) =>
                          prev ? { ...prev, interests: newInterests } : null
                        );
                      }}
                    >
                      {interest}
                    </Badge>
                  );
                })}
              </div>

              <div className="flex space-x-2">
                <Input
                  placeholder="Add custom interest..."
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addInterest()}
                />
                <Button onClick={addInterest} size="icon" variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {preferences?.interests && preferences.interests.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {preferences.interests.map((interest) => (
                    <Badge key={interest} variant="secondary" className="gap-1">
                      {interest}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => removeInterest(interest)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Privacy Settings */}
            <div className="space-y-4">
              <Label>Privacy Settings</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="discoverable"
                    checked={preferences?.discoverable || false}
                    onCheckedChange={(checked) =>
                      setPreferences((prev) =>
                        prev ? { ...prev, discoverable: !!checked } : null
                      )
                    }
                  />
                  <Label htmlFor="discoverable">
                    Make my profile discoverable
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showAge"
                    checked={preferences?.showAge !== false}
                    onCheckedChange={(checked) =>
                      setPreferences((prev) =>
                        prev ? { ...prev, showAge: !!checked } : null
                      )
                    }
                  />
                  <Label htmlFor="showAge">Show my age</Label>
                </div>
              </div>
            </div>

            <Button
              onClick={() => updatePreferences(preferences || {})}
              className="w-full"
              disabled={
                !preferences?.connectionTypes?.length ||
                !preferences?.discoverable
              }
            >
              Complete Setup
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 py-8">
      <div className="mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Discover People
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">
              Find people with shared interests near you
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
            <Dialog
              open={showPreferences}
              onOpenChange={handlePreferencesDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <Settings className="w-4 h-4 mr-2" />
                  Profile Settings
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center">
                    <Settings className="w-5 h-5 mr-2 text-purple-600" />
                    Profile Settings
                  </DialogTitle>
                </DialogHeader>

                {dialogPreferences && (
                  <div className="space-y-6">
                    <p className="text-gray-600 dark:text-gray-400">
                      Customize your profile to find better matches.
                    </p>

                    {/* City Selection */}
                    <div className="space-y-2">
                      <Label>City</Label>
                      <CitySearch
                        variant="form"
                        value={dialogPreferences.cityId || ""}
                        onValueChange={(cityName) => {
                          setDialogPreferences((prev) =>
                            prev ? { ...prev, cityId: cityName } : null
                          );
                        }}
                        placeholder="Search and select your city"
                        className="w-full"
                      />
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Choose your city to find people nearby
                      </p>
                    </div>

                    {/* Connection Types */}
                    <div className="space-y-3">
                      <Label>What are you looking for?</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {connectionTypeOptions.map((option) => {
                          const IconComponent = option.icon;
                          const isSelected =
                            dialogPreferences.connectionTypes?.includes(
                              option.value
                            );

                          return (
                            <div
                              key={option.value}
                              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                isSelected
                                  ? `border-${option.color}-500 bg-${option.color}-50 dark:bg-${option.color}-900/20`
                                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                              }`}
                              onClick={() => {
                                const currentTypes =
                                  dialogPreferences.connectionTypes || [];
                                const newTypes = isSelected
                                  ? currentTypes.filter(
                                      (t) => t !== option.value
                                    )
                                  : [...currentTypes, option.value];

                                setDialogPreferences((prev) =>
                                  prev
                                    ? { ...prev, connectionTypes: newTypes }
                                    : null
                                );
                              }}
                            >
                              <div className="flex items-center space-x-3">
                                <IconComponent
                                  className={`w-5 h-5 text-${option.color}-600`}
                                />
                                <span className="font-medium">
                                  {option.label}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Preferred Gender */}
                    <div className="space-y-3">
                      <Label>Preferred Gender</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Choose which gender you'd like to see in your discovery
                        feed
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div
                          className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            !dialogPreferences.gender
                              ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                              : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                          }`}
                          onClick={() => {
                            setDialogPreferences((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    gender: undefined,
                                  }
                                : null
                            );
                          }}
                        >
                          <span className="font-medium">No Preference</span>
                        </div>
                        {genderOptions.map((option) => {
                          const isSelected =
                            dialogPreferences.gender === option.value;
                          return (
                            <div
                              key={option.value}
                              className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                isSelected
                                  ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                              }`}
                              onClick={() => {
                                setDialogPreferences((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        gender: option.value,
                                      }
                                    : null
                                );
                              }}
                            >
                              <span className="font-medium">
                                {option.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Relationship Status */}
                    <div className="space-y-3">
                      <Label>Relationship Status</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {relationshipOptions.map((option) => {
                          const isSelected =
                            dialogPreferences.relationshipStatus ===
                            option.value;
                          return (
                            <div
                              key={option.value}
                              className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                isSelected
                                  ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                              }`}
                              onClick={() => {
                                setDialogPreferences((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        relationshipStatus: option.value,
                                      }
                                    : null
                                );
                              }}
                            >
                              <span className="font-medium">
                                {option.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Age and Gender */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dialog-age">Age</Label>
                        <Input
                          id="dialog-age"
                          type="number"
                          min="18"
                          max="100"
                          placeholder="Enter your age"
                          value={dialogPreferences.age?.toString() || ""}
                          onChange={(e) =>
                            setDialogPreferences((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    age: e.target.value
                                      ? parseInt(e.target.value)
                                      : undefined,
                                  }
                                : null
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dialog-gender">Gender</Label>
                        <select
                          id="dialog-gender"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={dialogPreferences.gender || ""}
                          onChange={(e) =>
                            setDialogPreferences((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    gender: e.target.value || undefined,
                                  }
                                : null
                            )
                          }
                        >
                          <option value="">Select gender</option>
                          {genderOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Bio */}
                    <div className="space-y-2">
                      <Label htmlFor="dialog-bio">Bio</Label>
                      <Textarea
                        id="dialog-bio"
                        placeholder="Tell people a bit about yourself..."
                        value={dialogPreferences.bio || ""}
                        onChange={(e) =>
                          setDialogPreferences((prev) =>
                            prev ? { ...prev, bio: e.target.value } : null
                          )
                        }
                        maxLength={500}
                      />
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {dialogPreferences.bio?.length || 0}/500 characters
                      </p>
                    </div>

                    {/* Profile Photos */}
                    <div className="space-y-3">
                      <Label>Profile Photos</Label>
                      <ProfilePhotosUpload
                        currentPhotos={dialogPreferences.photos || []}
                        onPhotosChange={(photos) =>
                          setDialogPreferences((prev) =>
                            prev ? { ...prev, photos } : null
                          )
                        }
                        disabled={false}
                        maxPhotos={6}
                      />
                    </div>

                    {/* Interests */}
                    <div className="space-y-3">
                      <Label>Interests</Label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {popularInterests.map((interest) => {
                          const isSelected =
                            dialogPreferences.interests?.includes(interest);
                          return (
                            <Badge
                              key={interest}
                              variant={isSelected ? "default" : "outline"}
                              className="cursor-pointer"
                              onClick={() => {
                                const currentInterests =
                                  dialogPreferences.interests || [];
                                const newInterests = isSelected
                                  ? currentInterests.filter(
                                      (i) => i !== interest
                                    )
                                  : [...currentInterests, interest];

                                setDialogPreferences((prev) =>
                                  prev
                                    ? { ...prev, interests: newInterests }
                                    : null
                                );
                              }}
                            >
                              {interest}
                            </Badge>
                          );
                        })}
                      </div>

                      <div className="flex space-x-2">
                        <Input
                          placeholder="Add custom interest..."
                          value={dialogNewInterest}
                          onChange={(e) => setDialogNewInterest(e.target.value)}
                          onKeyPress={(e) =>
                            e.key === "Enter" && addDialogInterest()
                          }
                        />
                        <Button
                          onClick={addDialogInterest}
                          size="icon"
                          variant="outline"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>

                      {dialogPreferences.interests &&
                        dialogPreferences.interests.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {dialogPreferences.interests.map((interest) => (
                              <Badge
                                key={interest}
                                variant="secondary"
                                className="gap-1"
                              >
                                {interest}
                                <X
                                  className="w-3 h-3 cursor-pointer"
                                  onClick={() => removeDialogInterest(interest)}
                                />
                              </Badge>
                            ))}
                          </div>
                        )}
                    </div>

                    {/* Privacy Settings */}
                    <div className="space-y-4">
                      <Label>Privacy Settings</Label>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="dialog-discoverable"
                            checked={dialogPreferences.discoverable || false}
                            onCheckedChange={(checked) =>
                              setDialogPreferences((prev) =>
                                prev
                                  ? { ...prev, discoverable: !!checked }
                                  : null
                              )
                            }
                          />
                          <Label htmlFor="dialog-discoverable">
                            Make my profile discoverable
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="dialog-showAge"
                            checked={dialogPreferences.showAge !== false}
                            onCheckedChange={(checked) =>
                              setDialogPreferences((prev) =>
                                prev ? { ...prev, showAge: !!checked } : null
                              )
                            }
                          />
                          <Label htmlFor="dialog-showAge">Show my age</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="dialog-showLocation"
                            checked={dialogPreferences.showLocation || false}
                            onCheckedChange={(checked) =>
                              setDialogPreferences((prev) =>
                                prev
                                  ? { ...prev, showLocation: !!checked }
                                  : null
                              )
                            }
                          />
                          <Label htmlFor="dialog-showLocation">
                            Show my location
                          </Label>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3 pt-4">
                      <Button
                        onClick={updateDialogPreferences}
                        className="flex-1"
                        disabled={
                          !dialogPreferences.connectionTypes?.length ||
                          !dialogPreferences.discoverable
                        }
                      >
                        Save Changes
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowPreferences(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* Delete Swipe Profile Button */}
            <Dialog
              open={showDeleteConfirm}
              onOpenChange={setShowDeleteConfirm}
            >
              <DialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Profile
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center text-red-600">
                    <Trash2 className="w-5 h-5 mr-2" />
                    Delete Swipe Profile
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-400">
                    Are you sure you want to delete your swipe profile? This
                    action cannot be undone and will:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li>Remove all your preferences and settings</li>
                    <li>Delete your profile photos</li>
                    <li>Remove all your likes and matches</li>
                    <li>Reset your swipe history</li>
                  </ul>
                  <p className="text-red-600 font-medium">
                    This action is permanent and cannot be reversed.
                  </p>
                </div>
                <div className="flex space-x-3 pt-4">
                  <Button
                    variant="destructive"
                    onClick={handleDeleteSwipeProfile}
                    disabled={isDeleting}
                    className="flex-1"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Profile
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Swipe Area */}
          <div className="lg:col-span-2">
            <SwipeStack
              users={users}
              onSwipe={handleSwipe}
              onLoadMore={() => fetchUsers(false)}
              isLoading={isLoading}
              hasMore={hasMore}
              swipeInfo={swipeInfo}
              onPurchaseSwipes={handlePurchaseSwipes}
              dailyLimitExceeded={dailyLimitExceeded}
              noUsersFound={noUsersFound}
              pricingTiers={pricingTiers}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Unread Likes Section */}
            <UnreadLikesSection
              onSwipe={handleSwipe}
              pricingTiers={pricingTiers}
              onPurchaseSwipes={handlePurchaseSwipes}
            />

            {/* Subscription Features */}
            {subscriptionStatus?.hasActiveSubscription &&
              subscriptionStatus.activePackage && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Crown className="h-5 w-5 text-yellow-600" />
                      {subscriptionStatus.activePackage.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
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
                  </CardContent>
                </Card>
              )}

            {/* Current Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Looking for
                  </Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {preferences?.connectionTypes?.map((type) => (
                      <Badge key={type} variant="outline" className="text-xs">
                        {type.toLowerCase()}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Gender Preference */}
                <div>
                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Preferred Gender
                  </Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {preferences?.gender
                        ? genderOptions.find(
                            (g) => g.value === preferences.gender
                          )?.label ||
                          preferences.gender.replace("_", " ").toLowerCase()
                        : "No Preference"}
                    </Badge>
                  </div>
                </div>

                {(preferences?.age || preferences?.gender) && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      About You
                    </Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {preferences?.age && (
                        <Badge variant="outline" className="text-xs">
                          {preferences.age} years old
                        </Badge>
                      )}
                      {preferences?.gender && (
                        <Badge variant="outline" className="text-xs">
                          {genderOptions.find(
                            (g) => g.value === preferences.gender
                          )?.label || preferences.gender}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {preferences?.interests && preferences.interests.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Interests
                    </Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {preferences.interests.slice(0, 8).map((interest) => (
                        <Badge
                          key={interest}
                          variant="secondary"
                          className="text-xs"
                        >
                          {interest}
                        </Badge>
                      ))}
                      {preferences.interests.length > 8 && (
                        <Badge variant="secondary" className="text-xs">
                          +{preferences.interests.length - 8}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Tips for Better Matches
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-purple-600 dark:text-purple-400 text-xs font-bold">
                      1
                    </span>
                  </div>
                  <p>
                    Add a bio and interests to your profile for better matches
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-purple-600 dark:text-purple-400 text-xs font-bold">
                      2
                    </span>
                  </div>
                  <p>Be selective with your likes to improve match quality</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-purple-600 dark:text-purple-400 text-xs font-bold">
                      3
                    </span>
                  </div>
                  <p>Start conversations with matches to build connections</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Packages Popup */}
      <PackagesPopup
        open={showPackagesPopup}
        onOpenChange={setShowPackagesPopup}
        onPurchaseSuccess={() => {
          fetchSubscriptionStatus();
          fetchUsers(true);
        }}
      />

      {/* KYC Verification Dialog */}
      <KycVerificationDialog
        isOpen={showKycDialog}
        onClose={() => {
          setShowKycDialog(false);
          setPendingSwipeAction(null);
        }}
        kycStatus={kycStatus}
        context="discover"
        onContinue={handleKycDialogContinue}
      />
    </div>
  );
}
