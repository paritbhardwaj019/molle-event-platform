"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  createSubscriptionPayment,
  getAvailablePackages,
  SubscriptionPackage,
} from "@/lib/actions/package";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check } from "lucide-react";

export function SubscriptionPurchase() {
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [purchasingPackageId, setPurchasingPackageId] = useState<string | null>(
    null
  );
  const { toast } = useToast();

  const loadPackages = async () => {
    setLoading(true);
    try {
      const result = await getAvailablePackages();
      if (result.success) {
        setPackages(result.data);
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load packages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Purchase package
  const purchasePackage = async (packageId: string) => {
    setPurchasingPackageId(packageId);
    try {
      const result = await createSubscriptionPayment({ packageId });

      if (result.success) {
        // Redirect to Cashfree payment page
        const { paymentSessionId } = result.data;

        // Load Cashfree SDK and redirect to payment
        if (typeof window !== "undefined" && (window as any).Cashfree) {
          const cashfree = (window as any).Cashfree;
          cashfree.init({
            mode: "production", // or "production"
          });

          cashfree.pay({
            sessionId: paymentSessionId,
            returnUrl: `${window.location.origin}/dashboard?payment_success=true`,
          });
        } else {
          const paymentUrl = `https://sandbox.cashfree.com/pg/view/${paymentSessionId}`;
          window.location.href = paymentUrl;
        }
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initiate payment",
        variant: "destructive",
      });
    } finally {
      setPurchasingPackageId(null);
    }
  };

  // Load packages on component mount
  useState(() => {
    loadPackages();
  });

  const getDurationText = (duration: string) => {
    switch (duration) {
      case "MONTHLY":
        return "Monthly";
      case "QUARTERLY":
        return "Quarterly";
      case "YEARLY":
        return "Yearly";
      case "LIFETIME":
        return "Lifetime";
      default:
        return duration;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading packages...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold">Choose Your Plan</h2>
        <p className="text-muted-foreground mt-2">
          Select a subscription package to unlock premium features
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <Card key={pkg.id} className="relative">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {pkg.name}
                <Badge variant="secondary">
                  {getDurationText(pkg.duration)}
                </Badge>
              </CardTitle>
              <CardDescription>{pkg.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <span className="text-3xl font-bold">₹{pkg.price}</span>
                <span className="text-muted-foreground">
                  /{getDurationText(pkg.duration).toLowerCase()}
                </span>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  <span>{pkg.dailySwipeLimit} daily swipes</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  <span>Premium features</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  <span>Priority support</span>
                </div>
              </div>

              <Button
                onClick={() => purchasePackage(pkg.id)}
                disabled={purchasingPackageId === pkg.id}
                className="w-full"
              >
                {purchasingPackageId === pkg.id ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  "Purchase Now"
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {packages.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            No packages available at the moment.
          </p>
        </div>
      )}
    </div>
  );
}
