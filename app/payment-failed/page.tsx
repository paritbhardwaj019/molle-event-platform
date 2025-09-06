"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  CreditCard,
  Package,
} from "lucide-react";
import { toast } from "sonner";

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const orderId = searchParams.get("order_id");
  const paymentType = searchParams.get("type"); // "package" or "booking"
  const errorCode = searchParams.get("error_code");
  const errorMessage = searchParams.get("error_message");
  const amount = searchParams.get("amount");

  useEffect(() => {
    // Show error toast if there's an error message
    if (errorMessage) {
      toast.error("Payment Failed", {
        description: errorMessage,
      });
    }
  }, [errorMessage]);

  const handleRetryPayment = async () => {
    setIsLoading(true);
    try {
      if (paymentType === "package") {
        // Redirect to packages popup or subscription page
        router.push("/dashboard/social/discover?showPackages=true");
      } else {
        // For booking payments, redirect back to the booking page
        const eventSlug = searchParams.get("event_slug");
        if (eventSlug) {
          router.push(`/book/${eventSlug}`);
        } else {
          router.push("/events");
        }
      }
    } catch (error) {
      console.error("Error retrying payment:", error);
      toast.error("Failed to retry payment");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoHome = () => {
    router.push("/");
  };

  const handleGoToEvents = () => {
    router.push("/events");
  };

  const handleGoToSwipes = () => {
    router.push("/dashboard/social/discover");
  };

  const getFailureMessage = () => {
    if (errorCode) {
      switch (errorCode) {
        case "INSUFFICIENT_FUNDS":
          return "Your payment method has insufficient funds. Please try with a different payment method.";
        case "CARD_DECLINED":
          return "Your card was declined. Please check your card details or try a different payment method.";
        case "PAYMENT_EXPIRED":
          return "The payment session has expired. Please try again.";
        case "USER_CANCELLED":
          return "Payment was cancelled. You can try again anytime.";
        case "BANK_DECLINED":
          return "Your bank declined the transaction. Please contact your bank or try a different payment method.";
        default:
          return (
            errorMessage ||
            "Payment failed due to an unexpected error. Please try again."
          );
      }
    }
    return (
      errorMessage ||
      "Payment failed due to an unexpected error. Please try again."
    );
  };

  const getTitle = () => {
    if (paymentType === "package") {
      return "Subscription Payment Failed";
    }
    return "Booking Payment Failed";
  };

  const getIcon = () => {
    if (paymentType === "package") {
      return <Package className="w-12 h-12 text-red-500" />;
    }
    return <CreditCard className="w-12 h-12 text-red-500" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">{getIcon()}</div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {getTitle()}
          </CardTitle>
          <p className="text-gray-600 mt-2">
            We couldn't process your payment. Don't worry, you can try again.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Error Details */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-red-800 mb-1">
                  What went wrong?
                </h4>
                <p className="text-sm text-red-700">{getFailureMessage()}</p>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          {orderId && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-800 mb-2">
                Payment Details
              </h4>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Order ID:</span>
                  <span className="font-mono">{orderId}</span>
                </div>
                {amount && (
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-medium">₹{amount}</span>
                  </div>
                )}
                {errorCode && (
                  <div className="flex justify-between">
                    <span>Error Code:</span>
                    <span className="font-mono text-red-600">{errorCode}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleRetryPayment}
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </>
              )}
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={handleGoHome}
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Home
              </Button>

              {paymentType === "package" ? (
                <Button
                  variant="outline"
                  onClick={handleGoToSwipes}
                  className="w-full"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Swipes
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleGoToEvents}
                  className="w-full"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Browse Events
                </Button>
              )}
            </div>
          </div>

          {/* Help Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2">
              Need Help?
            </h4>
            <p className="text-sm text-blue-700 mb-3">
              If you continue to experience issues, please contact our support
              team.
            </p>
            <div className="space-y-2 text-sm text-blue-600">
              <p>• Check your payment method details</p>
              <p>• Ensure you have sufficient funds</p>
              <p>• Try a different payment method</p>
              <p>• Contact your bank if the issue persists</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PaymentFailedFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Loading...
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={<PaymentFailedFallback />}>
      <PaymentFailedContent />
    </Suspense>
  );
}
