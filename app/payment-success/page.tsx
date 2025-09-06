"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle,
  ArrowRight,
  Package,
  CreditCard,
  Download,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<
    "success" | "failed" | "pending" | null
  >(null);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [pollingAttempts, setPollingAttempts] = useState(0);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const maxPollingAttempts = 3;

  const orderId = searchParams.get("order_id");
  const paymentType = searchParams.get("type");
  const cfId = searchParams.get("cf_id");

  useEffect(() => {
    if (orderId && cfId) {
      checkPaymentStatus(orderId, cfId);
    }
  }, [orderId, cfId]);

  const checkPaymentStatus = async (orderId: string, cfId: string) => {
    try {
      setIsCheckingPayment(true);
      setPollingAttempts(0);

      const attemptCheck = async (attempt: number): Promise<void> => {
        if (attempt > maxPollingAttempts) {
          setPaymentStatus("failed");
          return;
        }

        let response;
        if (paymentType === "package") {
          response = await fetch(
            `/api/subscription-payments/${orderId}/status`
          );
        } else {
          response = await fetch(`/api/bookings/${orderId}/status`);
        }

        const result = await response.json();

        if (result.success) {
          const payment = result.data;

          if (paymentType === "package") {
            if (payment.status === "COMPLETED") {
              setPaymentStatus("success");
              setPaymentDetails(payment);
              toast.success("Payment Successful!", {
                description: "Your subscription has been activated!",
              });
              return;
            } else if (payment.status === "FAILED") {
              setPaymentStatus("failed");
              return;
            }
          } else {
            if (
              payment.paymentStatus === "COMPLETED" &&
              payment.ticketsCount > 0
            ) {
              setPaymentStatus("success");
              setPaymentDetails(payment);
              toast.success("Payment Successful!", {
                description: "Your booking has been confirmed!",
              });
              return;
            } else if (payment.paymentStatus === "FAILED") {
              setPaymentStatus("failed");
              return;
            }
          }

          setPaymentStatus("pending");
          setPollingAttempts(attempt);

          if (attempt < maxPollingAttempts) {
            setTimeout(() => {
              attemptCheck(attempt + 1);
            }, 2000);
          } else {
            setPaymentStatus("failed");
          }
        } else {
          if (attempt < maxPollingAttempts) {
            setTimeout(() => {
              attemptCheck(attempt + 1);
            }, 2000);
          } else {
            setPaymentStatus("failed");
          }
        }
      };

      await attemptCheck(1);
    } catch (error) {
      console.error("Error checking payment status:", error);
      setPaymentStatus("failed");
    } finally {
      setIsCheckingPayment(false);
    }
  };

  const handleContinue = () => {
    if (paymentType === "package") {
      router.push("/dashboard/social/discover");
    } else {
      router.push("/bookings");
    }
  };

  const handleGoHome = () => {
    router.push("/");
  };

  const handleDownloadTicket = () => {
    toast.info("Ticket download feature coming soon!");
  };

  const getTitle = () => {
    if (paymentType === "package") {
      return "Subscription Activated!";
    }
    return "Booking Confirmed!";
  };

  const getMessage = () => {
    if (paymentType === "package") {
      return "Your subscription has been successfully activated. You can now enjoy unlimited swipes and premium features!";
    }
    return "Your booking has been confirmed successfully. You will receive your tickets shortly!";
  };

  const getIcon = () => {
    if (paymentType === "package") {
      return <Package className="w-12 h-12 text-green-500" />;
    }
    return <CreditCard className="w-12 h-12 text-green-500" />;
  };

  if (paymentStatus === "pending" || isCheckingPayment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Loader2 className="w-12 h-12 text-yellow-500 animate-spin" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Processing Payment
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Please wait while we process your payment. This may take a few
              moments.
            </p>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-sm text-gray-500">
                Attempt {pollingAttempts + 1} of {maxPollingAttempts + 1}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentStatus === "failed") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <X className="w-12 h-12 text-red-500" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Payment Failed
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Your payment was not successful. Please try again or contact
              support if the issue persists.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => router.push("/subscription")}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/contact-us")}
              className="w-full"
            >
              Contact Support
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentStatus === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="relative">
                {getIcon()}
                <CheckCircle className="w-6 h-6 text-green-500 absolute -top-2 -right-2 bg-white rounded-full" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              {getTitle()}
            </CardTitle>
            <p className="text-gray-600 mt-2">{getMessage()}</p>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-green-800 mb-1">
                    Payment Details
                  </h4>
                  <div className="space-y-1 text-sm text-green-700">
                    {paymentDetails?.orderId && (
                      <div className="flex justify-between">
                        <span>Order ID:</span>
                        <span className="font-mono">
                          {paymentDetails.orderId}
                        </span>
                      </div>
                    )}
                    {paymentDetails?.paymentId && (
                      <div className="flex justify-between">
                        <span>Payment ID:</span>
                        <span className="font-mono">
                          {paymentDetails.paymentId}
                        </span>
                      </div>
                    )}
                    {paymentDetails?.amount && (
                      <div className="flex justify-between">
                        <span>Amount:</span>
                        <span className="font-medium">
                          ₹{Number(paymentDetails.amount).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2">
                What's Next?
              </h4>
              <div className="space-y-2 text-sm text-blue-700">
                {paymentType === "package" ? (
                  <>
                    <p>• Your subscription is now active</p>
                    <p>• You can start swiping with unlimited access</p>
                    <p>• Premium features are now unlocked</p>
                    <p>• Check your email for confirmation</p>
                  </>
                ) : (
                  <>
                    <p>• Your tickets will be sent to your email</p>
                    <p>• You can view your booking in your account</p>
                    <p>• Download your tickets from the bookings page</p>
                    <p>• Check your email for confirmation</p>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleContinue}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                {paymentType === "package"
                  ? "Start Swiping"
                  : "View My Bookings"}
              </Button>

              {paymentType === "booking" && (
                <Button
                  variant="outline"
                  onClick={handleDownloadTicket}
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Tickets
                </Button>
              )}

              <Button
                variant="outline"
                onClick={handleGoHome}
                className="w-full"
              >
                Go Home
              </Button>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-800 mb-2">
                Need Help?
              </h4>
              <p className="text-sm text-gray-600">
                If you have any questions about your{" "}
                {paymentType === "package" ? "subscription" : "booking"}, please
                don't hesitate to contact our support team.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Loader2 className="w-12 h-12 text-green-500 animate-spin" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Loading...
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}

function PaymentSuccessFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Loading...
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<PaymentSuccessFallback />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
