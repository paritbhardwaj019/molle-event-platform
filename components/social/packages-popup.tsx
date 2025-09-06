"use client";

import { useState, useEffect } from "react";
import { X, Zap, Check, Crown, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getAvailablePackages,
  createSubscriptionPayment,
} from "@/lib/actions/package";
import { PackageDuration } from "@prisma/client";
import { toast } from "sonner";

declare global {
  interface Window {
    Cashfree: any;
  }
}

// Type for packages returned by getAvailablePackages
type AvailablePackage = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  dailySwipeLimit: number;
  duration: PackageDuration;
  allowBadge: boolean;
  canSeeLikes: boolean;
  priorityMatching: boolean;
  isHidden: boolean;
};

interface PackagesPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPurchaseSuccess?: () => void;
}

const durationLabels = {
  [PackageDuration.MONTHLY]: "Monthly",
  [PackageDuration.QUARTERLY]: "Quarterly",
  [PackageDuration.YEARLY]: "Yearly",
  [PackageDuration.LIFETIME]: "Lifetime",
};

const getDurationIcon = (duration: PackageDuration) => {
  switch (duration) {
    case PackageDuration.LIFETIME:
      return <Crown className="h-4 w-4 text-yellow-500" />;
    case PackageDuration.YEARLY:
      return <Star className="h-4 w-4 text-blue-500" />;
    default:
      return <Zap className="h-4 w-4 text-purple-500" />;
  }
};

export function PackagesPopup({
  open,
  onOpenChange,
  onPurchaseSuccess,
}: PackagesPopupProps) {
  const [packages, setPackages] = useState<AvailablePackage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [purchasingPackageId, setPurchasingPackageId] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (open) {
      fetchPackages();
    }
  }, [open]);

  // Load Cashfree SDK
  useEffect(() => {
    const loadCashfree = async () => {
      try {
        const cashfreeModule = await import(
          "@cashfreepayments/cashfree-js" as any
        );
        const cashfree = await cashfreeModule.load({
          mode: "production",
        });
        (window as any).Cashfree = cashfree;
      } catch (error) {
        console.error("Failed to load Cashfree SDK:", error);
      }
    };

    loadCashfree();
  }, []);

  // Handle payment success detection
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("payment_success") === "true") {
      const orderId = urlParams.get("order_id");
      const amount = urlParams.get("amount");
      const paymentId = urlParams.get("payment_id");

      // Redirect to payment success page
      const successUrl = `/payment-success?type=package&order_id=${orderId}&amount=${amount}&payment_id=${paymentId}`;
      window.location.href = successUrl;
      return;
    }

    // Check for payment failure
    const paymentFailed = urlParams.get("payment_failed");
    const orderId = urlParams.get("order_id");
    const errorCode = urlParams.get("error_code");
    const errorMessage = urlParams.get("error_message");
    const amount = urlParams.get("amount");

    if (paymentFailed === "true") {
      // Redirect to payment failure page
      const failureUrl = `/payment-failed?type=package&order_id=${orderId}&error_code=${errorCode}&error_message=${errorMessage}&amount=${amount}`;
      window.location.href = failureUrl;
      return;
    }
  }, [onPurchaseSuccess]);

  const fetchPackages = async () => {
    setIsLoading(true);
    try {
      const result = await getAvailablePackages();
      if (result.success && result.data) {
        // Filter out hidden packages and free plans
        const visiblePackages = result.data.filter(
          (pkg) => !pkg.isHidden && pkg.price > 0
        );
        setPackages(visiblePackages);
      } else {
        toast.error("Failed to load packages", {
          description: result.error || "Unable to load subscription packages.",
        });
      }
    } catch (error) {
      console.error("Failed to fetch packages:", error);
      toast.error("Failed to load packages", {
        description: "An error occurred while loading packages.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async (packageId: string) => {
    try {
      setPurchasingPackageId(packageId);
      const result = await createSubscriptionPayment({ packageId });

      if (!result.success || !result.data) {
        toast.error("Failed to initiate payment", {
          description:
            result.error || "An error occurred while processing your request.",
        });
        return;
      }

      const { paymentSessionId } = result.data;

      if (!paymentSessionId) {
        toast.error("Payment session not created", {
          description: "Unable to create payment session. Please try again.",
        });
        return;
      }

      const cashfree = (window as any).Cashfree;
      if (!cashfree) {
        toast.error("Cashfree SDK not loaded");
        return;
      }

      const checkoutOptions = {
        paymentSessionId: paymentSessionId,
        redirectTarget: "_self", // Opens in same tab
      };

      try {
        await cashfree.checkout(checkoutOptions);
        // For redirect checkout, the user will be redirected to Cashfree
        // The success/failure will be handled via the return URL
      } catch (error) {
        console.error("Payment checkout error:", error);
        toast.error("Payment checkout failed. Please try again.");
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Payment failed. Please try again.");
    } finally {
      setPurchasingPackageId(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(price);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Choose Your Plan
            </h2>
            <p className="text-gray-600 mt-1">
              Upgrade to unlock unlimited swipes, premium features, and better
              matching
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Packages Grid */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                <span className="text-gray-600">Loading packages...</span>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages.map((pkg) => (
                <Card
                  key={pkg.id}
                  className={`relative transition-all hover:shadow-lg ${
                    pkg.duration === PackageDuration.LIFETIME
                      ? "border-yellow-300 bg-gradient-to-br from-yellow-50 to-orange-50"
                      : pkg.duration === PackageDuration.YEARLY
                        ? "border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50"
                        : "border-gray-200"
                  }`}
                >
                  {pkg.duration === PackageDuration.LIFETIME && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-yellow-500 text-white px-3 py-1">
                        <Crown className="h-3 w-3 mr-1" />
                        Best Value
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-4">
                    <div className="flex items-center justify-center mb-2">
                      {getDurationIcon(pkg.duration)}
                    </div>
                    <CardTitle className="text-xl">{pkg.name}</CardTitle>
                    <div className="text-3xl font-bold text-gray-900">
                      {formatPrice(pkg.price)}
                    </div>
                    <div className="text-sm text-gray-500">
                      per {durationLabels[pkg.duration].toLowerCase()}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {pkg.description && (
                      <p className="text-sm text-gray-600 text-center">
                        {pkg.description}
                      </p>
                    )}

                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-6 h-6 bg-green-100 rounded-full">
                          <Check className="h-3 w-3 text-green-600" />
                        </div>
                        <span className="text-sm">
                          <strong>
                            {pkg.dailySwipeLimit >= 999999
                              ? "Unlimited"
                              : pkg.dailySwipeLimit}
                          </strong>{" "}
                          {pkg.dailySwipeLimit >= 999999
                            ? "swipes"
                            : "daily swipes"}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-6 h-6 bg-green-100 rounded-full">
                          <Check className="h-3 w-3 text-green-600" />
                        </div>
                        <span className="text-sm">
                          {durationLabels[pkg.duration]} subscription
                        </span>
                      </div>

                      {pkg.priorityMatching && (
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-6 h-6 bg-purple-100 rounded-full">
                            <Star className="h-3 w-3 text-purple-600" />
                          </div>
                          <span className="text-sm">Priority matching</span>
                        </div>
                      )}

                      {pkg.canSeeLikes && (
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full">
                            <Check className="h-3 w-3 text-blue-600" />
                          </div>
                          <span className="text-sm">See who liked you</span>
                        </div>
                      )}

                      {pkg.allowBadge && (
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-6 h-6 bg-yellow-100 rounded-full">
                            <Crown className="h-3 w-3 text-yellow-600" />
                          </div>
                          <span className="text-sm">Gold badge</span>
                        </div>
                      )}

                      {pkg.duration === PackageDuration.LIFETIME && (
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-6 h-6 bg-yellow-100 rounded-full">
                            <Star className="h-3 w-3 text-yellow-600" />
                          </div>
                          <span className="text-sm font-medium text-yellow-700">
                            Lifetime access
                          </span>
                        </div>
                      )}
                    </div>

                    <Button
                      className="w-full mt-6"
                      onClick={() => handlePurchase(pkg.id)}
                      disabled={isLoading || purchasingPackageId === pkg.id}
                      variant={
                        pkg.duration === PackageDuration.LIFETIME
                          ? "default"
                          : "outline"
                      }
                    >
                      {purchasingPackageId === pkg.id
                        ? "Redirecting to Payment..."
                        : `Purchase ${pkg.name}`}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              All subscriptions include unlimited access to premium features and
              priority support. Cancel anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
