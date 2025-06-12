"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getEventBySlug, getEventPackages } from "@/lib/actions/event";
import { createBookingWithPayment, verifyPayment } from "@/lib/actions/payment";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useLoggedInUser } from "@/lib/hooks/use-logged-in-user";
import { Loader2, ChevronLeft } from "lucide-react";
import Script from "next/script";

type BookingStep = "packages" | "confirmation";

interface PackageSelection {
  packageId: string;
  quantity: number;
}

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useLoggedInUser();
  const [isLoading, setIsLoading] = useState(true);
  const [event, setEvent] = useState<any>(null);
  const [selectedPackages, setSelectedPackages] = useState<PackageSelection[]>(
    []
  );
  const [currentStep, setCurrentStep] = useState<BookingStep>("packages");
  const [packages, setPackages] = useState<any[]>([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEvent() {
      const eventResult = await getEventBySlug(params.slug as string);
      if (!eventResult.success || !eventResult.data) {
        toast.error("Event not found");
        router.push("/events");
        return;
      }

      setEvent(eventResult.data);
      setIsLoading(false);
    }

    fetchEvent();
  }, [params.slug, router]);

  useEffect(() => {
    async function fetchPackages() {
      if (!event?.id) return;
      setIsLoadingPackages(true);
      const result = await getEventPackages(event.id);
      if (result.success && result.data) {
        setPackages(result.data);
      } else {
        toast.error("Failed to fetch packages");
      }
      setIsLoadingPackages(false);
    }

    if (event?.id) {
      fetchPackages();
    }
  }, [event?.id]);

  // Add Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    // Get the ref parameter from the URL
    const searchParams = new URLSearchParams(window.location.search);
    const refCode = searchParams.get("ref");
    if (refCode) {
      setReferralCode(refCode);
    }
  }, []);

  const handlePackageSelectionChange = (selections: PackageSelection[]) => {
    setSelectedPackages(selections);
  };

  const handlePreviousStep = () => {
    if (currentStep === "confirmation") {
      setCurrentStep("packages");
    }
  };

  const handleNextStep = () => {
    if (currentStep === "packages") {
      if (selectedPackages.length === 0) {
        toast.error("Please select at least one package");
        return;
      }
      setCurrentStep("confirmation");
    }
  };

  const getTotalAmount = () => {
    return selectedPackages.reduce((total, selection) => {
      const pkg = packages.find((p) => p.id === selection.packageId);
      return total + (pkg?.price || 0) * selection.quantity;
    }, 0);
  };

  const getBookingFee = () => {
    return getTotalAmount() * 0.02; // 2% booking fee
  };

  const handlePayment = async () => {
    try {
      setIsProcessingPayment(true);

      // Calculate total tickets
      const totalTickets = selectedPackages.reduce(
        (sum, pkg) => sum + pkg.quantity,
        0
      );

      // Create booking and get Razorpay order
      const result = await createBookingWithPayment({
        eventId: event.id,
        packageId: selectedPackages[0].packageId,
        ticketCount: totalTickets,
        totalAmount: getTotalAmount() + getBookingFee(),
        referralCode: referralCode || undefined,
      });

      if (!result.success || !result.data) {
        toast.error(result.error || "Failed to create booking");
        return;
      }

      const options = {
        key: result.data.key,
        amount: result.data.amount * 100,
        currency: result.data.currency,
        name: event.title,
        description: `Booking #${result.data.bookingNumber}`,
        order_id: result.data.orderId,
        prefill: {
          name: result.data.user.name,
          email: result.data.user.email,
          contact: result.data.user.phone,
        },
        handler: async function (response: any) {
          try {
            const verificationResult = await verifyPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );

            if (verificationResult.success) {
              toast.success("Payment successful!");
              router.push("/bookings"); // Redirect to bookings page
            } else {
              toast.error("Payment verification failed");
            }
          } catch (error) {
            console.error("Payment verification error:", error);
            toast.error("Failed to verify payment");
          }
        },
        modal: {
          ondismiss: function () {
            setIsProcessingPayment(false);
          },
        },
        theme: {
          color: "#0F172A",
        },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Failed to process payment");
      setIsProcessingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-4 mb-8">
          {currentStep === "confirmation" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePreviousStep}
              className="text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          <h1 className="text-3xl font-bold text-white">Book {event.title}</h1>
        </div>

        {/* Booking Steps */}
        <div className="flex items-center space-x-4 mb-8">
          <div className="flex-1">
            <div
              className={`h-2 rounded-full ${
                currentStep === "packages" ? "bg-primary" : "bg-gray-600"
              }`}
            />
            <p className="text-sm text-white mt-2">Select Packages</p>
          </div>
          <div className="flex-1">
            <div
              className={`h-2 rounded-full ${
                currentStep === "confirmation" ? "bg-primary" : "bg-gray-600"
              }`}
            />
            <p className="text-sm text-white mt-2">Confirmation</p>
          </div>
        </div>

        {/* Packages */}
        {currentStep === "packages" && (
          <div className="mb-8">
            {isLoadingPackages ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {packages.map((pkg: any) => (
                  <Card key={pkg.id} className="p-4">
                    <div className="text-white">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">{pkg.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {pkg.description}
                          </p>
                        </div>
                        <div className="text-lg font-semibold">
                          ₹{pkg.price.toFixed(2)}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-4">
                        <label className="text-sm">Quantity:</label>
                        <input
                          type="number"
                          min="0"
                          max={pkg.maxTickets || 999}
                          value={
                            selectedPackages.find((s) => s.packageId === pkg.id)
                              ?.quantity || 0
                          }
                          onChange={(e) =>
                            handlePackageSelectionChange([
                              ...selectedPackages.filter(
                                (s) => s.packageId !== pkg.id
                              ),
                              {
                                packageId: pkg.id,
                                quantity: parseInt(e.target.value) || 0,
                              },
                            ])
                          }
                          className="w-20 px-2 py-1 bg-background border rounded-md"
                        />
                      </div>

                      {pkg.benefits && pkg.benefits.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium mb-2">
                            Includes:
                          </h4>
                          <ul className="list-disc list-inside text-sm text-muted-foreground">
                            {pkg.benefits.map(
                              (benefit: string, index: number) => (
                                <li key={index}>{benefit}</li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Confirmation Step */}
        {currentStep === "confirmation" && (
          <div className="max-w-2xl mx-auto">
            <Card className="p-6 mb-6">
              <div className="space-y-6 text-white">
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Selected Packages
                  </h3>
                  {selectedPackages.map((selection) => {
                    const pkg = packages.find(
                      (p) => p.id === selection.packageId
                    );
                    if (!pkg) return null;
                    return (
                      <div
                        key={pkg.id}
                        className="flex justify-between items-center py-2 border-b border-white/10"
                      >
                        <div>
                          <p className="font-medium">{pkg.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Quantity: {selection.quantity}
                          </p>
                        </div>
                        <p className="font-medium">
                          ₹{(pkg.price * selection.quantity).toFixed(2)}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 space-y-2">
                  <div className="flex justify-between">
                    <p>Sub-total</p>
                    <p>₹{getTotalAmount().toFixed(2)}</p>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <p>Booking Fee</p>
                    <p>₹{getBookingFee().toFixed(2)}</p>
                  </div>
                  <div className="flex justify-between text-lg font-semibold pt-2 border-t border-white/10">
                    <p>Total Amount</p>
                    <p>₹{(getTotalAmount() + getBookingFee()).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </Card>

            <div className="flex justify-end">
              <Button
                className="min-w-[200px]"
                onClick={handlePayment}
                disabled={isProcessingPayment}
              >
                {isProcessingPayment ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Pay Now"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Navigation */}
        {currentStep === "packages" && (
          <div className="flex justify-end">
            <Button
              onClick={handleNextStep}
              disabled={selectedPackages.length === 0}
              className="min-w-[200px]"
            >
              Review & Pay
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
