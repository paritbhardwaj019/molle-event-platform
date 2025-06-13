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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { calculateFees } from "@/lib/actions/settings";

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

  const calculateTotalFees = async (baseAmount: number) => {
    const calculatedFees = await calculateFees(baseAmount);
    setFees(calculatedFees);
    return calculatedFees;
  };

  const handleNextStep = async () => {
    if (currentStep === "packages") {
      if (selectedPackages.length === 0) {
        toast.error("Please select at least one package");
        return;
      }

      // Validate ticket holder details
      const hasEmptyFields = selectedPackages.some((pkg) =>
        pkg.ticketHolders.some(
          (holder) => !holder.name || !holder.age || !holder.phone
        )
      );

      if (hasEmptyFields) {
        toast.error("Please fill in all ticket holder details");
        return;
      }

      // Calculate fees before proceeding
      const baseAmount = getTotalAmount();
      await calculateTotalFees(baseAmount);
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

  // Helper: Get total selected tickets globally
  const getTotalSelectedTickets = () =>
    selectedPackages.reduce((sum, s) => sum + s.quantity, 0);

  // Helper: Get max tickets for the event
  const getEventMaxTickets = () => event?.maxTickets || 0;

  const handleTicketHolderChange = (
    packageId: string,
    index: number,
    field: keyof TicketHolder,
    value: string
  ) => {
    setSelectedPackages((prev) =>
      prev.map((pkg) => {
        if (pkg.packageId === packageId) {
          const updatedHolders = [...pkg.ticketHolders];
          updatedHolders[index] = { ...updatedHolders[index], [field]: value };
          return { ...pkg, ticketHolders: updatedHolders };
        }
        return pkg;
      })
    );
  };

  const handleIncrement = (pkg: any) => {
    const globalMax = getEventMaxTickets();
    const totalSelected = getTotalSelectedTickets();
    const current =
      selectedPackages.find((s) => s.packageId === pkg.id)?.quantity || 0;
    const perPackageMax = pkg.maxTickets || 999;
    if (totalSelected < globalMax && current < perPackageMax) {
      setSelectedPackages([
        ...selectedPackages.filter((s) => s.packageId !== pkg.id),
        {
          packageId: pkg.id,
          quantity: current + 1,
          ticketHolders: [...Array(current + 1)].map(() => ({
            name: "",
            age: "",
            phone: "",
          })),
        },
      ]);
    }
  };

  const handleDecrement = (pkg: any) => {
    const current =
      selectedPackages.find((s) => s.packageId === pkg.id)?.quantity || 0;
    if (current > 0) {
      setSelectedPackages([
        ...selectedPackages.filter((s) => s.packageId !== pkg.id),
        {
          packageId: pkg.id,
          quantity: current - 1,
          ticketHolders: [...Array(current - 1)].map(() => ({
            name: "",
            age: "",
            phone: "",
          })),
        },
      ]);
    }
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
        totalAmount: fees.userPays,
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
                {packages.map((pkg: any) => {
                  const selected =
                    selectedPackages.find((s) => s.packageId === pkg.id)
                      ?.quantity || 0;
                  const globalMax = getEventMaxTickets();
                  const totalSelected = getTotalSelectedTickets();
                  const perPackageMax = pkg.maxTickets || 999;
                  const canIncrement =
                    totalSelected < globalMax && selected < perPackageMax;
                  const currentPackage = selectedPackages.find(
                    (s) => s.packageId === pkg.id
                  );

                  return (
                    <Card
                      key={pkg.id}
                      className="p-6 bg-white flex flex-col gap-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-black">
                            {pkg.name}
                          </h3>
                          <p className="text-sm text-muted-foreground text-gray-500">
                            {pkg.description}
                          </p>
                        </div>
                        <div className="text-lg font-semibold text-black">
                          ₹{pkg.price.toFixed(2)}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm font-medium text-gray-700">
                          Quantity
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="w-8 h-8 px-0 hover:bg-gray-100 transition-colors"
                            onClick={() => handleDecrement(pkg)}
                            disabled={selected === 0}
                          >
                            -
                          </Button>
                          <span className="w-8 text-center font-medium text-black">
                            {selected}
                          </span>
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="w-8 h-8 px-0 hover:bg-gray-100 transition-colors"
                            onClick={() => handleIncrement(pkg)}
                            disabled={!canIncrement}
                          >
                            +
                          </Button>
                        </div>
                        <div className="flex items-center gap-1.5 ml-2">
                          <span className="text-xs text-gray-500">Max</span>
                          <span className="text-xs font-medium text-gray-700">
                            {perPackageMax}
                          </span>
                          <span className="text-xs text-gray-500">
                            per booking
                          </span>
                        </div>
                      </div>

                      {selected > 0 && (
                        <div className="mt-4 space-y-4">
                          <h4 className="text-sm font-medium text-gray-700">
                            Ticket Holder Details
                          </h4>
                          {currentPackage?.ticketHolders.map(
                            (holder, index) => (
                              <div
                                key={index}
                                className="space-y-3 p-3 bg-gray-50 rounded-lg"
                              >
                                <h5 className="text-sm font-medium text-gray-600">
                                  Ticket {index + 1}
                                </h5>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-2">
                                    <Label htmlFor={`name-${pkg.id}-${index}`}>
                                      Name
                                    </Label>
                                    <Input
                                      id={`name-${pkg.id}-${index}`}
                                      value={holder.name}
                                      onChange={(e) =>
                                        handleTicketHolderChange(
                                          pkg.id,
                                          index,
                                          "name",
                                          e.target.value
                                        )
                                      }
                                      placeholder="Full name"
                                      className="bg-white"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor={`age-${pkg.id}-${index}`}>
                                      Age
                                    </Label>
                                    <Input
                                      id={`age-${pkg.id}-${index}`}
                                      type="number"
                                      value={holder.age}
                                      onChange={(e) =>
                                        handleTicketHolderChange(
                                          pkg.id,
                                          index,
                                          "age",
                                          e.target.value
                                        )
                                      }
                                      placeholder="Age"
                                      className="bg-white"
                                    />
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`phone-${pkg.id}-${index}`}>
                                    Phone Number
                                  </Label>
                                  <Input
                                    id={`phone-${pkg.id}-${index}`}
                                    type="tel"
                                    value={holder.phone}
                                    onChange={(e) =>
                                      handleTicketHolderChange(
                                        pkg.id,
                                        index,
                                        "phone",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Phone number"
                                    className="bg-white"
                                  />
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      )}

                      {pkg.benefits && pkg.benefits.length > 0 && (
                        <div className="mt-2">
                          <h4 className="text-sm font-medium mb-1 text-gray-500">
                            Includes
                          </h4>
                          <ul className="list-disc list-inside text-sm text-gray-500">
                            {pkg.benefits.map(
                              (benefit: string, index: number) => (
                                <li key={index}>{benefit}</li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Confirmation Step */}
        {currentStep === "confirmation" && (
          <div className="max-w-2xl mx-auto">
            <Card className="p-6 mb-6 bg-white">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-900">
                    Booking Summary
                  </h3>
                  {selectedPackages.map((selection) => {
                    const pkg = packages.find(
                      (p) => p.id === selection.packageId
                    );
                    if (!pkg) return null;
                    return (
                      <div key={pkg.id} className="mb-6">
                        <div className="flex justify-between items-center py-3 border-b border-gray-200">
                          <div>
                            <p className="font-medium text-gray-900">
                              {pkg.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              Quantity - {selection.quantity}
                            </p>
                          </div>
                          <p className="font-medium text-gray-900">
                            ₹{(pkg.price * selection.quantity).toFixed(2)}
                          </p>
                        </div>

                        <div className="mt-4 space-y-3">
                          <h4 className="text-sm font-medium text-gray-700">
                            Ticket Holders
                          </h4>
                          {selection.ticketHolders.map((holder, index) => (
                            <div
                              key={index}
                              className="p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-gray-500">Name</p>
                                  <p className="font-medium text-gray-900">
                                    {holder.name}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Age</p>
                                  <p className="font-medium text-gray-900">
                                    {holder.age}
                                  </p>
                                </div>
                                <div className="col-span-2">
                                  <p className="text-sm text-gray-500">Phone</p>
                                  <p className="font-medium text-gray-900">
                                    {holder.phone}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Separator className="my-6" />

                <div className="space-y-3">
                  <div className="flex justify-between text-gray-600">
                    <p>Base Amount</p>
                    <p>₹{fees?.baseAmount.toFixed(2)}</p>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <p>Platform Fee</p>
                    <p>₹{fees?.totalPlatformFee.toFixed(2)}</p>
                  </div>
                  <div className="flex justify-between text-sm">
                    <p>CGST ({fees?.cgstPercentage}%)</p>
                    <p>₹{fees?.cgst.toFixed(2)}</p>
                  </div>
                  <div className="flex justify-between text-sm">
                    <p>SGST ({fees?.sgstPercentage}%)</p>
                    <p>₹{fees?.sgst.toFixed(2)}</p>
                  </div>
                  <div className="border-t border-gray-200 my-2"></div>
                  <div className="flex justify-between text-lg font-semibold">
                    <p className="text-gray-900">Total Amount</p>
                    <p className="text-gray-900">
                      ₹{fees?.userPays.toFixed(2)}
                    </p>
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
