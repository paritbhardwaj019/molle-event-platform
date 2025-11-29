"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getEventBySlug, getEventPackages } from "@/lib/actions/event";
import { createBookingWithPayment } from "@/lib/actions/payment";
import { createFreeBooking } from "@/lib/actions/booking";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useLoggedInUser } from "@/lib/hooks/use-logged-in-user";
import {
  Loader2,
  ChevronLeft,
  User,
  Phone,
  Calendar,
  Ticket,
  CreditCard,
  Check,
  Receipt,
  X,
} from "lucide-react";
import Script from "next/script";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { calculateFees } from "@/lib/actions/settings";
import { Badge } from "@/components/ui/badge";

declare global {
  interface Window {
    Cashfree: any;
  }
}

type BookingStep = "packages" | "confirmation";

interface TicketHolder {
  name: string;
  age: string;
  phone: string;
}

interface PackageSelection {
  packageId: string;
  quantity: number;
  ticketHolders: TicketHolder[];
}

interface EventPackage {
  id: string;
  name: string;
  description: string | null;
  price: any; // Using any to match the database decimal type
  maxTickets: number | null;
  allocation: number | null;
  benefits: string[];
  eventId: string;
  soldTickets: number;
  isFullHouse: boolean;
  remainingTickets: number;
}

interface EventData {
  id: string;
  title: string;
  startDate: Date;
  maxTickets: number;
  organizerName?: string;
  packages?: EventPackage[];
  host?: any;
  [key: string]: any; // Allow additional properties
}

interface FeeCalculation {
  userFeePercentage: number;
  hostFeePercentage: number;
  cgstPercentage: number;
  sgstPercentage: number;
  referralPercentage: number;
}

interface CreateBookingData {
  eventId: string;
  packageSelections: Array<{
    packageId: string;
    quantity: number;
    ticketHolders: Array<{
      fullName: string;
      age: number;
      phoneNumber: string;
    }>;
  }>;
  totalAmount: number;
  referralCode?: string;
  referralDiscount?: number;
}

// Tax rates will be fetched dynamically from settings

function toNumber(decimal: any): number {
  return decimal ? Number(decimal.toString()) : 0;
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
  const [fees, setFees] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<
    "success" | "failed" | "pending" | null
  >(null);
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [pollingAttempts, setPollingAttempts] = useState(0);
  const maxPollingAttempts = 3;
  const [showPriceBreakdown, setShowPriceBreakdown] = useState(false);

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

  useEffect(() => {
    async function fetchFees() {
      if (event) {
        const calculatedFees = await calculateFees(event);
        setFees(calculatedFees);
      }
    }
    fetchFees();
  }, [event]);

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

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const refCode = searchParams.get("ref");
    if (refCode) {
      setReferralCode(refCode);
    }

    const bookingId = searchParams.get("booking_id");
    const cfId = searchParams.get("cf_id");

    if (bookingId && cfId) {
      checkPaymentStatus(bookingId, cfId);
    }

    return () => {
      setPollingAttempts(0);
      setIsCheckingPayment(false);
    };
  }, [params.slug, router]);

  const checkPaymentStatus = async (bookingId: string, cfId: string) => {
    try {
      setIsCheckingPayment(true);
      setPollingAttempts(0);

      const attemptCheck = async (attempt: number): Promise<void> => {
        if (attempt > maxPollingAttempts) {
          setPaymentStatus("failed");
          return;
        }

        const response = await fetch(`/api/bookings/${bookingId}/status`);
        const result = await response.json();

        if (result.success) {
          const booking = result.data;

          if (
            booking.paymentStatus === "COMPLETED" &&
            booking.ticketsCount > 0
          ) {
            setPaymentStatus("success");
            setBookingDetails(booking);
            return;
          } else if (booking.paymentStatus === "FAILED") {
            setPaymentStatus("failed");
            return;
          } else {
            // Payment still pending, continue polling
            setPaymentStatus("pending");
            setPollingAttempts(attempt);

            if (attempt < maxPollingAttempts) {
              // Wait 2 seconds before next attempt
              setTimeout(() => {
                attemptCheck(attempt + 1);
              }, 2000);
            } else {
              // Max attempts reached, show failed
              setPaymentStatus("failed");
            }
          }
        } else {
          if (attempt < maxPollingAttempts) {
            // Wait 2 seconds before next attempt
            setTimeout(() => {
              attemptCheck(attempt + 1);
            }, 2000);
          } else {
            setPaymentStatus("failed");
          }
        }
      };

      // Start the polling process
      await attemptCheck(1);
    } catch (error) {
      console.error("Error checking payment status:", error);
      setPaymentStatus("failed");
    } finally {
      setIsCheckingPayment(false);
    }
  };

  const handlePackageSelectionChange = (selections: PackageSelection[]) => {
    setSelectedPackages(selections);
  };

  const handlePreviousStep = () => {
    if (currentStep === "confirmation") {
      setCurrentStep("packages");
    }
  };

  const handleNextStep = async () => {
    if (currentStep === "packages") {
      if (selectedPackages.length === 0) {
        toast.error("Please select at least one package");
        return;
      }

      const hasEmptyFields = selectedPackages.some((pkg) =>
        pkg.ticketHolders.some(
          (holder) => !holder.name || !holder.age || !holder.phone
        )
      );

      if (hasEmptyFields) {
        toast.error("Please fill in all ticket holder details");
        return;
      }

      setCurrentStep("confirmation");
    }
  };

  const getTotalTickets = () => {
    return selectedPackages.reduce((total, selection) => {
      return total + selection.quantity;
    }, 0);
  };

  const getTotalAmount = () => {
    return selectedPackages.reduce((total, selection) => {
      const pkg = packages.find((p) => p.id === selection.packageId);
      if (pkg) {
        const packagePrice = toNumber(pkg.price);
        const cgstAmount = packagePrice * ((fees?.cgstPercentage || 9) / 100);
        const sgstAmount = packagePrice * ((fees?.sgstPercentage || 9) / 100);
        const userFeeAmount =
          packagePrice * ((fees?.userFeePercentage || 5) / 100);
        const finalPrice =
          packagePrice + cgstAmount + sgstAmount + userFeeAmount;
        return total + finalPrice * selection.quantity;
      }
      return total;
    }, 0);
  };

  const getBaseAmount = () => {
    return selectedPackages.reduce((total, selection) => {
      const pkg = packages.find((p) => p.id === selection.packageId);
      if (pkg) {
        const packagePrice = toNumber(pkg.price);
        return total + packagePrice * selection.quantity;
      }
      return total;
    }, 0);
  };

  const getCGSTAmount = () => {
    return selectedPackages.reduce((total, selection) => {
      const pkg = packages.find((p) => p.id === selection.packageId);
      if (pkg) {
        const packagePrice = toNumber(pkg.price);
        const cgstAmount = packagePrice * ((fees?.cgstPercentage || 9) / 100);
        return total + cgstAmount * selection.quantity;
      }
      return total;
    }, 0);
  };

  // Calculate total SGST amount
  const getSGSTAmount = () => {
    return selectedPackages.reduce((total, selection) => {
      const pkg = packages.find((p) => p.id === selection.packageId);
      if (pkg) {
        const packagePrice = toNumber(pkg.price);
        const sgstAmount = packagePrice * ((fees?.sgstPercentage || 9) / 100);
        return total + sgstAmount * selection.quantity;
      }
      return total;
    }, 0);
  };

  // Calculate total platform fee
  const getPlatformFeeAmount = () => {
    return selectedPackages.reduce((total, selection) => {
      const pkg = packages.find((p) => p.id === selection.packageId);
      if (pkg) {
        const packagePrice = toNumber(pkg.price);
        const userFeeAmount =
          packagePrice * ((fees?.userFeePercentage || 5) / 100);
        return total + userFeeAmount * selection.quantity;
      }
      return total;
    }, 0);
  };

  // Helper: Get total selected tickets globally
  const getTotalSelectedTickets = () =>
    selectedPackages.reduce((sum, s) => sum + s.quantity, 0);

  // Helper: Get max tickets for the event
  const getEventMaxTickets = () => event?.maxTickets || 0;

  // Helper: Get base total for packages step (without fees and taxes)
  const getBaseTotalForPackagesStep = () => {
    return selectedPackages.reduce((total, selection) => {
      const pkg = packages.find((p) => p.id === selection.packageId);
      if (pkg) {
        const packagePrice = toNumber(pkg.price);
        return total + packagePrice * selection.quantity;
      }
      return total;
    }, 0);
  };

  if (paymentStatus === "success") {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="max-w-md mx-auto text-center bg-gray-800/50 border border-gray-700 rounded-2xl p-8">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">
            Payment Successful!
          </h1>
          <p className="text-gray-400 mb-6">
            Your booking has been confirmed. You will receive your tickets
            shortly.
          </p>
          <div className="space-y-4">
            <Button
              onClick={() => router.push("/bookings")}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              View My Bookings
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setPaymentStatus(null);
                setBookingDetails(null);
                setPollingAttempts(0);
                router.push(`/book/${params.slug}`);
              }}
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Book More Tickets
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Payment Failed UI
  if (paymentStatus === "failed") {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="max-w-md mx-auto text-center bg-gray-800/50 border border-gray-700 rounded-2xl p-8">
          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <X className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Payment Failed</h1>
          <p className="text-gray-400 mb-6">
            Your payment was not successful. Please try again or contact support
            if the issue persists.
          </p>
          <div className="space-y-4">
            <Button
              onClick={() => {
                setPaymentStatus(null);
                setBookingDetails(null);
                setPollingAttempts(0);
                router.push(`/book/${params.slug}`);
              }}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/contact-us")}
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Contact Support
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Payment Pending UI
  if (paymentStatus === "pending" || isCheckingPayment) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="max-w-md mx-auto text-center bg-gray-800/50 border border-gray-700 rounded-2xl p-8">
          <div className="w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">
            Processing Payment
          </h1>
          <p className="text-gray-400 mb-2">
            Please wait while we process your payment. This may take a few
            moments.
          </p>

          <div className="space-y-4">
            <Button
              variant="outline"
              onClick={() => {
                setPaymentStatus(null);
                setBookingDetails(null);
                setPollingAttempts(0);
                router.push(`/book/${params.slug}`);
              }}
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212]">
        <div className="text-center bg-gray-800/50 border border-gray-700 rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-white mb-4">
            Event not found
          </h1>
          <Button
            onClick={() => router.push("/events")}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            Browse Events
          </Button>
        </div>
      </div>
    );
  }

  const handlePayment = async () => {
    try {
      setIsProcessingPayment(true);

      // Get the total amount to pay
      const totalAmount = getTotalAmount();

      // Prepare package selections with ticket holders
      const packageSelections = selectedPackages.map((pkg) => ({
        packageId: pkg.packageId,
        quantity: pkg.quantity,
        ticketHolders: pkg.ticketHolders.map((holder) => ({
          fullName: holder.name,
          age: parseInt(holder.age) || 18,
          phoneNumber: holder.phone,
        })),
      }));

      // Check if this is a free booking (total amount is 0)
      if (totalAmount === 0) {
        const result = await createFreeBooking({
          eventId: event.id,
          packageSelections: packageSelections,
          referralCode: referralCode || undefined,
        });

        if (!result.success || !result.data) {
          toast.error(result.error || "Failed to create booking");
          setIsProcessingPayment(false);
          return;
        }

        // Show success and redirect
        toast.success("Free tickets booked successfully!");
        setPaymentStatus("success");
        setBookingDetails({
          bookingNumber: result.data.bookingNumber,
          ticketsCount: getTotalTickets(),
        });
        setIsProcessingPayment(false);
        return;
      }

      // Handle paid booking with payment flow
      const result = await createBookingWithPayment({
        eventId: event.id,
        packageSelections: packageSelections,
        totalAmount: totalAmount,
        referralCode: referralCode || undefined,
      });

      console.log("RESULT", result);

      if (!result.success || !result.data) {
        toast.error(result.error || "Failed to create booking");
        setIsProcessingPayment(false);
        return;
      }

      const cashfree = (window as any).Cashfree;
      if (!cashfree) {
        toast.error("Cashfree SDK not loaded");
        setIsProcessingPayment(false);
        return;
      }

      const checkoutOptions = {
        paymentSessionId: result.data.paymentSessionId,
        redirectTarget: "_self",
      };

      try {
        await cashfree.checkout(checkoutOptions);
        // For redirect checkout, the user will be redirected to Cashfree
        // The success/failure will be handled via the return URL
      } catch (error) {
        console.error("Payment checkout error:", error);
        toast.error("Payment checkout failed. Please try again.");
        setIsProcessingPayment(false);
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Payment failed. Please try again.");
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212]">
      <div className="container mx-auto px-2 sm:px-4 py-8">
        <div className="md:max-w-6xl md:mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-6 text-gray-300 hover:text-white hover:bg-gray-800/50"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Event
            </Button>
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">
                {event.title}
              </h1>
              <p className="text-gray-400 text-lg">
                Complete your booking experience
              </p>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="mb-12">
            <div className="flex items-center justify-center space-x-4 max-w-sm mx-auto">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    currentStep === "packages"
                      ? "bg-purple-600 border-purple-600 text-white"
                      : currentStep === "confirmation"
                        ? "bg-green-600 border-green-600 text-white"
                        : "border-gray-600 text-gray-400"
                  }`}
                >
                  {currentStep === "confirmation" ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Ticket className="w-4 h-4" />
                  )}
                </div>
                <span
                  className={`font-medium text-sm ${
                    currentStep === "packages"
                      ? "text-purple-400"
                      : currentStep === "confirmation"
                        ? "text-green-400"
                        : "text-gray-500"
                  }`}
                >
                  Select Packages
                </span>
              </div>
              <div
                className={`flex-1 h-0.5 transition-colors duration-300 ${
                  currentStep === "confirmation"
                    ? "bg-green-600"
                    : "bg-gray-700"
                }`}
              ></div>
              <div className="flex items-center space-x-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    currentStep === "confirmation"
                      ? "bg-purple-600 border-purple-600 text-white"
                      : "border-gray-600 text-gray-400"
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                </div>
                <span
                  className={`font-medium text-sm ${
                    currentStep === "confirmation"
                      ? "text-purple-400"
                      : "text-gray-500"
                  }`}
                >
                  Payment
                </span>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
              {currentStep === "packages" && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2">
                      Choose Your Package
                    </h2>
                    <p className="text-gray-400">
                      Select the perfect experience for your event
                    </p>
                  </div>

                  {isLoadingPackages ? (
                    <div className="flex justify-center py-12">
                      <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-4" />
                        <p className="text-gray-400">Loading packages...</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-6">
                      {packages.map((pkg: any) => {
                        const selected =
                          selectedPackages.find((s) => s.packageId === pkg.id)
                            ?.quantity || 0;
                        const globalMax = getEventMaxTickets();
                        const totalSelected = getTotalSelectedTickets();
                        const perPackageMax = pkg.maxTickets || 999;
                        const allocationLimit = pkg.remainingTickets || 999;
                        const canIncrement =
                          totalSelected < globalMax &&
                          selected < perPackageMax &&
                          !pkg.isFullHouse &&
                          selected < allocationLimit;
                        const currentPackage = selectedPackages.find(
                          (s) => s.packageId === pkg.id
                        );

                        // Calculate pricing for this package
                        const packagePrice = toNumber(pkg.price);
                        const cgstAmount =
                          packagePrice * ((fees?.cgstPercentage || 9) / 100);
                        const sgstAmount =
                          packagePrice * ((fees?.sgstPercentage || 9) / 100);
                        const userFeeAmount =
                          packagePrice * ((fees?.userFeePercentage || 5) / 100);
                        const finalPrice =
                          packagePrice +
                          cgstAmount +
                          sgstAmount +
                          userFeeAmount;

                        return (
                          <div
                            key={pkg.id}
                            className={`bg-gray-800/50 border-2 rounded-2xl p-6 transition-all duration-300 relative ${
                              pkg.isFullHouse
                                ? "border-red-500 bg-red-500/10 opacity-75"
                                : selected > 0
                                  ? "border-purple-500 bg-purple-500/10 hover:bg-gray-800/70"
                                  : "border-gray-700 hover:bg-gray-800/70"
                            }`}
                          >
                            <div className="flex justify-between items-start mb-6">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                  <h3 className="text-lg font-bold text-white">
                                    {pkg.name}
                                  </h3>
                                  {packagePrice === 0 && (
                                    <Badge className="bg-green-600 text-white whitespace-nowrap">
                                      FREE
                                    </Badge>
                                  )}
                                  {pkg.isFullHouse && (
                                    <Badge className="bg-red-600 text-white whitespace-nowrap">
                                      FULL HOUSE
                                    </Badge>
                                  )}
                                  {!pkg.isFullHouse && selected > 0 && (
                                    <Badge className="bg-purple-600 text-white whitespace-nowrap">
                                      {selected} selected
                                    </Badge>
                                  )}
                                  {!pkg.isFullHouse &&
                                    pkg.allocation &&
                                    pkg.remainingTickets <= 5 &&
                                    pkg.remainingTickets > 0 && (
                                      <Badge className="bg-orange-600 text-white whitespace-nowrap">
                                        Only {pkg.remainingTickets} left
                                      </Badge>
                                    )}
                                </div>
                                <p className="text-gray-400 mb-4">
                                  {pkg.description}
                                </p>
                              </div>
                              <div className="text-right ml-6">
                                <div className="text-2xl font-bold text-yellow-400">
                                  {packagePrice === 0 ? (
                                    <span className="text-green-400">FREE</span>
                                  ) : (
                                    `₹${packagePrice.toFixed(2)}`
                                  )}
                                </div>
                                <div className="text-sm text-gray-500">
                                  per ticket
                                </div>
                                {packagePrice > 0 && (
                                  <div className="text-xs text-gray-400 mt-1">
                                    (Base price)
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="mb-6">
                              <h4 className="text-sm font-semibold text-gray-300 mb-3">
                                What's included:
                              </h4>
                              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {pkg.benefits.map(
                                  (benefit: string, index: number) => (
                                    <li
                                      key={index}
                                      className="text-sm text-gray-300 flex items-center"
                                    >
                                      <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-3 flex-shrink-0"></div>
                                      {benefit}
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>

                            {pkg.isFullHouse ? (
                              <div className="mb-6 p-4 bg-red-900/30 border border-red-600/50 rounded-xl text-center">
                                <div className="text-red-400 font-bold text-lg mb-2">
                                  FULLY BOOKED
                                </div>
                                <div className="text-red-300 text-sm">
                                  All {pkg.allocation} tickets for this package
                                  have been sold
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between mb-6 p-4 bg-gray-900/50 rounded-xl">
                                <span className="text-white font-medium text-base">
                                  Quantity
                                </span>
                                <div className="flex items-center space-x-3">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => {
                                      if (selected > 0) {
                                        const newSelections = selectedPackages
                                          .map((s) =>
                                            s.packageId === pkg.id
                                              ? {
                                                  ...s,
                                                  quantity: s.quantity - 1,
                                                  ticketHolders:
                                                    s.ticketHolders.slice(
                                                      0,
                                                      -1
                                                    ),
                                                }
                                              : s
                                          )
                                          .filter((s) => s.quantity > 0);
                                        handlePackageSelectionChange(
                                          newSelections
                                        );
                                      }
                                    }}
                                    disabled={selected === 0}
                                    className="w-8 h-8 rounded-full bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                                  >
                                    -
                                  </Button>
                                  <span className="w-10 text-center text-lg font-bold text-white">
                                    {selected}
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => {
                                      if (canIncrement) {
                                        const existingSelection =
                                          selectedPackages.find(
                                            (s) => s.packageId === pkg.id
                                          );
                                        if (existingSelection) {
                                          const newSelections =
                                            selectedPackages.map((s) =>
                                              s.packageId === pkg.id
                                                ? {
                                                    ...s,
                                                    quantity: s.quantity + 1,
                                                    ticketHolders: [
                                                      ...s.ticketHolders,
                                                      {
                                                        name: "",
                                                        age: "",
                                                        phone: "",
                                                      },
                                                    ],
                                                  }
                                                : s
                                            );
                                          handlePackageSelectionChange(
                                            newSelections
                                          );
                                        } else {
                                          const newSelections = [
                                            ...selectedPackages,
                                            {
                                              packageId: pkg.id,
                                              quantity: 1,
                                              ticketHolders: [
                                                {
                                                  name: "",
                                                  age: "",
                                                  phone: "",
                                                },
                                              ],
                                            },
                                          ];
                                          handlePackageSelectionChange(
                                            newSelections
                                          );
                                        }
                                      }
                                    }}
                                    disabled={!canIncrement}
                                    className="w-8 h-8 rounded-full bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                                  >
                                    +
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Ticket holder details */}
                            {currentPackage &&
                              currentPackage.ticketHolders.length > 0 &&
                              !pkg.isFullHouse && (
                                <div className="space-y-4">
                                  <div className="flex items-center gap-2 mb-4">
                                    <User className="w-5 h-5 text-purple-400" />
                                    <h4 className="text-lg font-semibold text-white">
                                      Ticket Holder Details
                                    </h4>
                                  </div>
                                  {currentPackage.ticketHolders.map(
                                    (holder, holderIndex) => (
                                      <div
                                        key={holderIndex}
                                        className="bg-gray-900/50 border border-gray-700 rounded-xl p-6"
                                      >
                                        <h5 className="text-white font-medium mb-4 flex items-center gap-2">
                                          <Ticket className="w-4 h-4 text-purple-400" />
                                          Ticket #{holderIndex + 1}
                                        </h5>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
                                          <div className="space-y-2">
                                            <Label
                                              htmlFor={`name-${pkg.id}-${holderIndex}`}
                                              className="text-sm font-medium text-gray-300 flex items-center gap-2"
                                            >
                                              <User className="w-4 h-4" />
                                              Full Name *
                                            </Label>
                                            <Input
                                              id={`name-${pkg.id}-${holderIndex}`}
                                              value={holder.name}
                                              onChange={(e) => {
                                                const newSelections =
                                                  selectedPackages.map((s) =>
                                                    s.packageId === pkg.id
                                                      ? {
                                                          ...s,
                                                          ticketHolders:
                                                            s.ticketHolders.map(
                                                              (h, i) =>
                                                                i ===
                                                                holderIndex
                                                                  ? {
                                                                      ...h,
                                                                      name: e
                                                                        .target
                                                                        .value,
                                                                    }
                                                                  : h
                                                            ),
                                                        }
                                                      : s
                                                  );
                                                handlePackageSelectionChange(
                                                  newSelections
                                                );
                                              }}
                                              placeholder="Enter full name"
                                              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500"
                                            />
                                          </div>
                                          <div className="space-y-2">
                                            <Label
                                              htmlFor={`age-${pkg.id}-${holderIndex}`}
                                              className="text-sm font-medium text-gray-300 flex items-center gap-2"
                                            >
                                              <Calendar className="w-4 h-4" />
                                              Age *
                                            </Label>
                                            <Input
                                              id={`age-${pkg.id}-${holderIndex}`}
                                              value={holder.age}
                                              onChange={(e) => {
                                                const newSelections =
                                                  selectedPackages.map((s) =>
                                                    s.packageId === pkg.id
                                                      ? {
                                                          ...s,
                                                          ticketHolders:
                                                            s.ticketHolders.map(
                                                              (h, i) =>
                                                                i ===
                                                                holderIndex
                                                                  ? {
                                                                      ...h,
                                                                      age: e
                                                                        .target
                                                                        .value,
                                                                    }
                                                                  : h
                                                            ),
                                                        }
                                                      : s
                                                  );
                                                handlePackageSelectionChange(
                                                  newSelections
                                                );
                                              }}
                                              placeholder="Enter age"
                                              type="number"
                                              min="1"
                                              max="100"
                                              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500"
                                            />
                                          </div>
                                          <div className="space-y-2">
                                            <Label
                                              htmlFor={`phone-${pkg.id}-${holderIndex}`}
                                              className="text-sm font-medium text-gray-300 flex items-center gap-2"
                                            >
                                              <Phone className="w-4 h-4" />
                                              Phone Number *
                                            </Label>
                                            <Input
                                              id={`phone-${pkg.id}-${holderIndex}`}
                                              value={holder.phone}
                                              onChange={(e) => {
                                                const newSelections =
                                                  selectedPackages.map((s) =>
                                                    s.packageId === pkg.id
                                                      ? {
                                                          ...s,
                                                          ticketHolders:
                                                            s.ticketHolders.map(
                                                              (h, i) =>
                                                                i ===
                                                                holderIndex
                                                                  ? {
                                                                      ...h,
                                                                      phone:
                                                                        e.target
                                                                          .value,
                                                                    }
                                                                  : h
                                                            ),
                                                        }
                                                      : s
                                                  );
                                                handlePackageSelectionChange(
                                                  newSelections
                                                );
                                              }}
                                              placeholder="Enter phone number"
                                              type="tel"
                                              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  )}
                                </div>
                              )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {currentStep === "confirmation" && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2">
                      Review Your Booking
                    </h2>
                    <p className="text-gray-400">
                      {getTotalAmount() === 0
                        ? "Please review your selection before confirming"
                        : "Please review your selection before payment"}
                    </p>
                    {getTotalAmount() === 0 && (
                      <div className="mt-3 inline-flex items-center gap-2 bg-green-600/20 border border-green-600/50 text-green-400 px-4 py-2 rounded-full text-sm">
                        <Check className="w-4 h-4" />
                        This is a free booking - no payment required
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <Receipt className="w-5 h-5 text-purple-400" />
                      <h3 className="text-lg font-bold text-white">
                        Booking Summary
                      </h3>
                    </div>

                    <div className="space-y-6">
                      {selectedPackages.map((selection) => {
                        const pkg = packages.find(
                          (p) => p.id === selection.packageId
                        );
                        if (!pkg) return null;

                        const packagePrice = toNumber(pkg.price);
                        const cgstAmount =
                          packagePrice * ((fees?.cgstPercentage || 9) / 100);
                        const sgstAmount =
                          packagePrice * ((fees?.sgstPercentage || 9) / 100);
                        const userFeeAmount =
                          packagePrice * ((fees?.userFeePercentage || 5) / 100);
                        const finalPricePerTicket =
                          packagePrice +
                          cgstAmount +
                          sgstAmount +
                          userFeeAmount;

                        return (
                          <div key={pkg.id} className="space-y-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-semibold text-white">
                                  {pkg.name}
                                </h4>
                                <p className="text-xs sm:text-sm text-gray-400">
                                  {selection.quantity} ticket
                                  {selection.quantity > 1 ? "s" : ""} × ₹
                                  {finalPricePerTicket.toFixed(2)}
                                </p>
                              </div>
                              <p className="font-semibold text-base sm:text-lg text-yellow-400 whitespace-nowrap">
                                ₹
                                {(
                                  finalPricePerTicket * selection.quantity
                                ).toFixed(2)}
                              </p>
                            </div>

                            <div className="pl-4 border-l-2 border-gray-700 space-y-4">
                              <h5 className="text-sm font-semibold text-gray-300">
                                Ticket Holders:
                              </h5>
                              {selection.ticketHolders.map((holder, index) => (
                                <div
                                  key={index}
                                  className="bg-gray-900/50 p-3 sm:p-4 rounded-xl border border-gray-700"
                                >
                                  <div className="flex items-center gap-2 mb-3">
                                    <Ticket className="w-4 h-4 text-purple-400" />
                                    <h6 className="text-white font-medium text-sm">
                                      Ticket #{index + 1}
                                    </h6>
                                  </div>
                                  <div className="space-y-2 text-xs sm:text-sm text-gray-300">
                                    <div className="flex items-center gap-3">
                                      <User className="w-4 h-4 text-gray-500" />
                                      <span>{holder.name}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <Calendar className="w-4 h-4 text-gray-500" />
                                      <span>Age: {holder.age}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <Phone className="w-4 h-4 text-gray-500" />
                                      <span>{holder.phone}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <Separator className="my-6 bg-gray-700" />

                    <div className="space-y-4">
                      <div className="flex justify-between text-gray-300">
                        <p className="flex items-center gap-2">
                          <Ticket className="w-4 h-4" />
                          Base Amount ({getTotalTickets()} ticket
                          {getTotalTickets() > 1 ? "s" : ""})
                        </p>
                        <p className="font-medium">
                          ₹{getBaseAmount().toFixed(2)}
                        </p>
                      </div>
                      <div className="flex justify-between text-sm text-gray-400">
                        <p>CGST</p>
                        <p>₹{getCGSTAmount().toFixed(2)}</p>
                      </div>
                      <div className="flex justify-between text-sm text-gray-400">
                        <p>SGST</p>
                        <p>₹{getSGSTAmount().toFixed(2)}</p>
                      </div>
                      <div className="flex justify-between text-sm text-gray-400">
                        <p>Platform Fee</p>
                        <p>₹{getPlatformFeeAmount().toFixed(2)}</p>
                      </div>
                      <Separator className="bg-gray-700" />
                      <div className="flex justify-between text-xl font-bold">
                        <span className="text-white">Total Amount</span>
                        <span className="text-yellow-400">
                          ₹{getTotalAmount().toFixed(2)}
                        </span>
                      </div>

                      {/* Tax breakdown explanation */}
                      <div className="mt-6">
                        {!showPriceBreakdown ? (
                          <Button
                            variant="outline"
                            onClick={() => setShowPriceBreakdown(true)}
                            className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                          >
                            Read More - Price Breakdown
                          </Button>
                        ) : (
                          <div className="bg-gray-900/50 border border-gray-700 p-4 rounded-md">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="font-medium text-white">
                                Price Breakdown
                              </h3>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowPriceBreakdown(false)}
                                className="text-gray-400 hover:text-white p-1"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="text-sm text-gray-300 space-y-2">
                              <p>
                                • Base Ticket Price: The original price of the
                                ticket
                              </p>
                              <p>
                                • CGST ({fees?.cgstPercentage || 9}%): Central
                                Goods & Services Tax applied on base price
                              </p>
                              <p>
                                • SGST ({fees?.sgstPercentage || 9}%): State
                                Goods & Services Tax applied on base price
                              </p>
                              <p>
                                • Platform Fee ({fees?.userFeePercentage || 5}
                                %): Our service fee for using the platform
                              </p>
                              <p className="font-medium pt-1 text-white">
                                • Total: Base Price + CGST + SGST + Platform Fee
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation buttons */}
              <div className="flex items-center flex-col gap-2 sm:gap-0 sm:flex-row justify-between mt-8 w-full">
                {currentStep === "confirmation" && (
                  <Button
                    variant="outline"
                    onClick={handlePreviousStep}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white w-full"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                )}
                {currentStep === "packages" && (
                  <Button
                    onClick={handleNextStep}
                    disabled={selectedPackages.length === 0}
                    className="ml-auto bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 text-lg font-semibold w-full"
                  >
                    Continue to Review
                    <ChevronLeft className="w-4 h-4 ml-2 rotate-180" />
                  </Button>
                )}
                {currentStep === "confirmation" && (
                  <Button
                    onClick={handlePayment}
                    disabled={isProcessingPayment}
                    className={`ml-auto text-white px-8 py-3 text-lg font-semibold w-full ${
                      getTotalAmount() === 0
                        ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                        : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    }`}
                  >
                    {isProcessingPayment ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        {getTotalAmount() === 0
                          ? "Booking..."
                          : "Processing Payment..."}
                      </>
                    ) : getTotalAmount() === 0 ? (
                      <>
                        <Ticket className="w-5 h-5 mr-2" />
                        Confirm Free Booking
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5 mr-2" />
                        Pay ₹{getTotalAmount().toFixed(2)}
                        <span className="text-xs ml-2 opacity-80">
                          (Incl. GST)
                        </span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 sticky top-8">
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  Event Details
                </h3>
                <div className="space-y-4 text-sm">
                  <div className="pb-4 border-b border-gray-700">
                    <h4 className="font-semibold text-white text-lg mb-1">
                      {event.title}
                    </h4>
                    <p className="text-gray-400">by {event.organizerName}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-300 mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Date & Time
                    </p>
                    <p className="text-white font-medium">
                      {new Date(event.startDate).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    <p className="text-gray-400">
                      {new Date(event.startDate).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-300 mb-2">Crowd Size</p>
                    <p className="text-white">{event.maxTickets} people</p>
                  </div>
                </div>

                {currentStep === "confirmation" && (
                  <>
                    <Separator className="my-6 bg-gray-700" />
                    <div className="space-y-3">
                      <div className="flex justify-between text-gray-300">
                        <span>Total Tickets</span>
                        <span className="font-semibold text-white">
                          {getTotalTickets()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-400">
                        <span>Base Amount</span>
                        <span>₹{getBaseAmount().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-400">
                        <span>Taxes & Fees</span>
                        <span>
                          ₹
                          {(
                            getCGSTAmount() +
                            getSGSTAmount() +
                            getPlatformFeeAmount()
                          ).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-lg font-bold">
                        <span className="text-white">Total Amount</span>
                        <span className="text-yellow-400">
                          ₹{getTotalAmount().toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {selectedPackages.length > 0 && currentStep === "packages" && (
                  <>
                    <Separator className="my-6 bg-gray-700" />
                    <div className="space-y-3">
                      <h4 className="font-medium text-white">
                        Current Selection
                      </h4>
                      <div className="space-y-2">
                        {selectedPackages.map((selection) => {
                          const pkg = packages.find(
                            (p) => p.id === selection.packageId
                          );
                          if (!pkg) return null;
                          return (
                            <div
                              key={pkg.id}
                              className="flex justify-between text-sm"
                            >
                              <span className="text-gray-400">{pkg.name}</span>
                              <span className="text-white">
                                {selection.quantity}x
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-700">
                        <span className="text-white">Subtotal</span>
                        <span className="text-yellow-400">
                          ₹{getBaseTotalForPackagesStep().toFixed(2)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1 text-right">
                        (Base price - taxes & fees will be added at checkout)
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
