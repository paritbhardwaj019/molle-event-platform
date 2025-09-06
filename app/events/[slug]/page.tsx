"use client";

import Image from "next/image";
import { notFound, useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  Users,
  MessageCircle,
  MapPin,
  Heart,
  UserPlus,
  MessageSquare,
  HandHeart,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Footer } from "@/components/footer";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getEventBySlug,
  hasUserPurchasedEventTickets,
  getCalculatedEventStatus,
} from "@/lib/actions/event";
import { getActiveEventRules } from "@/lib/actions/event-rule";
import { format, isSameDay } from "date-fns";
import { useLoggedInUser } from "@/lib/hooks/use-logged-in-user";
import { useEffect, useState } from "react";
import { getInviteStatusForUserAndEvent } from "@/lib/actions/invite";
import { getInviteFormForEvent } from "@/lib/actions/invite-form";
import { InviteStatus } from "@prisma/client";
import { toast } from "sonner";
import { use } from "react";
import { calculateFees } from "@/lib/actions/settings";
import { EventReviewsSection } from "@/components/reviews/event-reviews-section";
import { FollowButton } from "@/components/host/follow-button";
import { DynamicInviteForm } from "@/components/invite-forms/dynamic-invite-form";
import { EventImageCarousel } from "@/components/ui/event-image-carousel";
import { EventRulesSection } from "@/components/events/event-rules-section";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { usePWA } from "@/hooks/use-pwa";
import { PWAContentWrapper } from "@/components/pwa-content-wrapper";

function EventSkeleton() {
  const { isPWA, isClient } = usePWA();

  return (
    <PWAContentWrapper className="min-h-screen bg-[#121212]">
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Event Header Skeleton */}
            <div>
              <Skeleton className="h-12 w-3/4 bg-gray-800 mb-4" />
              <Skeleton className="w-full h-64 md:h-96 rounded-2xl bg-gray-800" />
            </div>

            {/* About Section Skeleton */}
            <div>
              <Skeleton className="h-8 w-48 bg-gray-800 mb-4" />
              <Skeleton className="h-24 w-full bg-gray-800 mb-6" />
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full bg-gray-800" />
                <div>
                  <Skeleton className="h-5 w-32 bg-gray-800 mb-2" />
                  <Skeleton className="h-4 w-24 bg-gray-800" />
                </div>
              </div>
            </div>

            {/* Amenities Skeleton */}
            <div>
              <Skeleton className="h-8 w-48 bg-gray-800 mb-4" />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Skeleton
                    key={i}
                    className="h-24 w-full bg-gray-800 rounded-lg"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Skeleton */}
          <div>
            <div className="bg-gray-800 rounded-2xl p-6">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-full bg-gray-700 mb-4" />
              ))}
              <Skeleton className="h-12 w-full bg-gray-700 mt-6" />
            </div>
          </div>
        </div>
      </main>
      {/* Only show footer when not in PWA mode */}
      {isClient && !isPWA && <Footer />}
    </PWAContentWrapper>
  );
}

function toNumber(decimal: any): number {
  return decimal ? Number(decimal.toString()) : 0;
}

function formatEventDateTime(startDate: Date, endDate: Date): string {
  const isSameDayEvent = isSameDay(startDate, endDate);

  if (isSameDayEvent) {
    return `${format(startDate, "EEE do MMM yyyy")} | ${format(startDate, "h:mm a")} - ${format(endDate, "h:mm a")}`;
  } else {
    return `${format(startDate, "EEE do MMM yyyy h:mm a")} - ${format(endDate, "EEE do MMM yyyy h:mm a")}`;
  }
}

function formatAgeLimit(
  minAge?: number | null,
  maxAge?: number | null
): string {
  // If no age limits are set, show default range
  if (!minAge && !maxAge) {
    return "18 to 85";
  }

  // Use provided values or defaults
  const displayMinAge = minAge || 18;
  const displayMaxAge = maxAge || 85;

  return `${displayMinAge} to ${displayMaxAge}`;
}

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { isAuthenticated, user } = useLoggedInUser();
  const [event, setEvent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteForm, setInviteForm] = useState<any>(null);
  const [inviteStatus, setInviteStatus] = useState<InviteStatus | null>(null);
  const [fees, setFees] = useState<any>(null);
  const [eventRules, setEventRules] = useState<any[]>([]);
  const [hasPurchasedTickets, setHasPurchasedTickets] =
    useState<boolean>(false);
  const [isCheckingTicketPurchase, setIsCheckingTicketPurchase] =
    useState<boolean>(false);
  const [calculatedEventStatus, setCalculatedEventStatus] = useState<
    string | null
  >(null);
  const [showConnectPopup, setShowConnectPopup] = useState(false);
  const [showPurchaseRequired, setShowPurchaseRequired] = useState(false);
  const { isPWA, isClient } = usePWA();

  useEffect(() => {
    async function fetchEvent() {
      const result = await getEventBySlug(resolvedParams.slug);
      if (!result.success || !result.data) {
        notFound();
        return;
      }

      const formattedEvent = {
        ...result.data,
        packages: result.data.packages.map((pkg: any) => ({
          ...pkg,
          price: Number(pkg.price),
        })),
      };

      setEvent(formattedEvent);
      setIsLoading(false);
    }
    fetchEvent();
  }, [resolvedParams.slug]);

  useEffect(() => {
    async function fetchEventRules() {
      const result = await getActiveEventRules();
      if (result.success && result.data) {
        setEventRules(result.data);
      }
    }
    fetchEventRules();
  }, []);

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
    async function checkInviteStatus() {
      if (!isAuthenticated || !user || !event) return;

      const result = await getInviteStatusForUserAndEvent(user.id, event.id);
      if (result.success && result.data) {
        setInviteStatus(result.data.status);
      }
    }

    checkInviteStatus();
  }, [isAuthenticated, user, event]);

  useEffect(() => {
    async function fetchInviteForm() {
      if (!event || event.eventType !== "INVITE_ONLY") return;

      const result = await getInviteFormForEvent(event.id);
      if (result.success && result.data) {
        setInviteForm(result.data);
      }
    }

    fetchInviteForm();
  }, [event]);

  useEffect(() => {
    async function checkTicketPurchase() {
      if (!isAuthenticated || !user || !event) return;

      setIsCheckingTicketPurchase(true);
      try {
        const result = await hasUserPurchasedEventTickets(event.id, user.id);
        if (result.success && result.data) {
          setHasPurchasedTickets(result.data.hasPurchased);
        }
      } catch (error) {
        console.error("Error checking ticket purchase:", error);
      } finally {
        setIsCheckingTicketPurchase(false);
      }
    }

    checkTicketPurchase();
  }, [isAuthenticated, user, event]);

  useEffect(() => {
    async function calculateEventStatus() {
      if (!event) return;

      try {
        const result = await getCalculatedEventStatus(event.id);
        if (result.success && result.data) {
          setCalculatedEventStatus(result.data.calculatedStatus);
        }
      } catch (error) {
        console.error("Error calculating event status:", error);
      }
    }

    calculateEventStatus();
  }, [event]);

  if (isLoading) {
    return <EventSkeleton />;
  }

  if (!event) {
    notFound();
  }

  // Redirect if event is expired
  if (calculatedEventStatus && calculatedEventStatus === "EXPIRED") {
    notFound();
  }

  const handleBookingClick = () => {
    if (!isAuthenticated) {
      const callbackURL = encodeURIComponent(`/events/${resolvedParams.slug}`);
      router.push(`/login?redirect=${callbackURL}`);
      return;
    }

    if (event.eventType === "INVITE_ONLY" && inviteStatus !== "APPROVED") {
      setShowInviteDialog(true);
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);
    const refCode = searchParams.get("ref");

    const bookingUrl = refCode
      ? `/book/${resolvedParams.slug}?ref=${refCode}`
      : `/book/${resolvedParams.slug}`;

    router.push(bookingUrl);
  };

  const handleInviteSuccess = () => {
    setInviteStatus(InviteStatus.PENDING);
    setShowInviteDialog(false);
  };

  const handleFindConnections = async () => {
    // Always show the connect features popup first, regardless of auth status
    setShowConnectPopup(true);
  };

  const handleContinueToConnect = () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      setShowConnectPopup(false);
      const callbackURL = encodeURIComponent(`/events/${resolvedParams.slug}`);
      router.push(`/login?redirect=${callbackURL}`);
      return;
    }

    // Check if user has purchased tickets
    if (!hasPurchasedTickets) {
      // Update the popup to show purchase requirement
      setShowPurchaseRequired(true);
      return;
    }

    // User is authenticated and has purchased tickets
    setShowConnectPopup(false);
    // Navigate to event social page
    router.push(`/dashboard/social/events/${event.id}`);
  };

  const handlePurchaseFromPopup = () => {
    setShowConnectPopup(false);
    setShowPurchaseRequired(false);
    handleBookingClick();
  };

  const handleClosePopup = () => {
    setShowConnectPopup(false);
    setShowPurchaseRequired(false);
  };

  const handleChatWithHost = () => {
    if (!isAuthenticated) {
      const callbackURL = encodeURIComponent(`/events/${resolvedParams.slug}`);
      router.push(`/login?redirect=${callbackURL}`);
      return;
    }

    // Navigate to chat page with host information
    const chatUrl = `/chat?hostId=${
      event.host.id
    }&eventTitle=${encodeURIComponent(event.title)}`;
    router.push(chatUrl);
  };

  const getBookingButtonText = () => {
    if (calculatedEventStatus && calculatedEventStatus === "FULL_HOUSE") {
      return "Event Full";
    }

    if (event.eventType === "INVITE_ONLY") {
      if (inviteStatus === "APPROVED") {
        return "Book Now!";
      }
      if (inviteStatus === "PENDING") {
        return "Request Pending";
      }
      if (inviteStatus === "REJECTED") {
        return "Request Rejected";
      }
      return "Request Booking";
    }
    return "Book Now!";
  };

  const isBookingDisabled = () => {
    if (
      (calculatedEventStatus && calculatedEventStatus === "FULL_HOUSE") ||
      (calculatedEventStatus && calculatedEventStatus === "EXPIRED")
    ) {
      return true;
    }

    if (event.eventType === "INVITE_ONLY") {
      return inviteStatus === "PENDING" || inviteStatus === "REJECTED";
    }
    return false;
  };

  return (
    <PWAContentWrapper className="min-h-screen bg-[#121212]">
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <h1 className="text-3xl md:text-4xl font-bold text-white">
                    {event.title}
                  </h1>
                </div>
              </div>
              <div className="mb-6">
                {event.images && event.images.length > 0 ? (
                  <EventImageCarousel
                    images={event.images}
                    eventTitle={event.title}
                    autoPlay={true}
                    autoPlayInterval={4000}
                  />
                ) : (
                  <div className="relative rounded-2xl overflow-hidden">
                    <Image
                      src={event.coverImage || "/placeholder.svg"}
                      alt={event.title}
                      width={800}
                      height={500}
                      className="w-full h-full object-cover"
                      priority
                    />
                  </div>
                )}
              </div>
            </div>

            {/* About Section */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">
                About The Event
              </h2>
              <div className="text-gray-300 mb-6 leading-relaxed">
                <RichTextEditor
                  content={event.description || ""}
                  onChange={() => {}} // No-op for read-only
                  editable={false}
                  className="border-0 p-0 bg-transparent prose-invert prose-sm max-w-none [&_.ProseMirror]:p-0 [&_p]:text-gray-300 [&_strong]:text-white [&_em]:text-gray-300 [&_ul]:text-gray-300 [&_ol]:text-gray-300 [&_li]:text-gray-300 [&_h1]:text-white [&_h2]:text-white [&_h3]:text-white [&_h4]:text-white [&_h5]:text-white [&_h6]:text-white"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={event.host.avatar || undefined} />
                    <AvatarFallback className="bg-purple-100 text-purple-700">
                      {event.host.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-white font-semibold">
                      <a
                        href={`/host/${event.host.id}`}
                        className="hover:text-purple-300 transition-colors cursor-pointer"
                      >
                        {event.host.name}
                      </a>
                    </p>
                    <p className="text-gray-400 text-sm">Event Host</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:space-x-3 w-full sm:w-auto">
                  <FollowButton
                    hostId={event.host.id}
                    hostName={event.host.name}
                    className="border-white/20 bg-black text-white hover:bg-white/10 hover:text-white w-full sm:w-auto"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleChatWithHost}
                    className="border-purple-400/50 bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 hover:text-purple-200 w-full sm:w-auto"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Chat With Host
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleFindConnections}
                    className="border-pink-400/50 bg-pink-600/20 text-pink-300 hover:bg-pink-600/30 hover:text-pink-200 w-full sm:w-auto"
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Join & Connect
                  </Button>
                </div>
              </div>
            </div>

            {/* Event Location */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Event Location
              </h2>
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <div className="flex items-start space-x-4">
                  <MapPin className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-white font-medium">
                      {event.city || event.location}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Amenities */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {event.amenities.map((amenityRelation: any) => {
                  const amenity = amenityRelation.amenity;

                  return (
                    <div
                      key={amenity.id}
                      className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 text-center hover:bg-gray-800/70 transition-colors"
                    >
                      <p className="text-white text-sm font-medium">
                        {amenity.name}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Packages */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Ticket Packages
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {event.packages.map((pkg: any) => {
                  const packagePrice = toNumber(pkg.price);

                  return (
                    <div
                      key={pkg.id}
                      className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 hover:bg-gray-800/70 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {pkg.name}
                          </h3>
                          <p className="text-sm text-gray-400">
                            {pkg.description}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-bold text-yellow-400">
                            ₹{packagePrice.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <ul className="space-y-2 mb-4">
                        {pkg.benefits.map((benefit: string, index: number) => (
                          <li
                            key={index}
                            className="text-sm text-gray-300 flex items-center"
                          >
                            <span className="mr-2 text-purple-400">•</span>
                            {benefit}
                          </li>
                        ))}
                      </ul>
                      <Button
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                        onClick={handleBookingClick}
                        disabled={isBookingDisabled()}
                      >
                        {getBookingButtonText()}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reviews Section */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">
                Reviews & Ratings
              </h2>
              <EventReviewsSection eventId={event.id} />
            </div>

            {/* Event Rules Section */}
            {eventRules.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">
                  Event Rules & Guidelines
                </h2>
                <EventRulesSection eventRules={eventRules} />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Event Info Card */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 sticky top-24">
              <div className="space-y-4 mb-6">
                <div className="flex items-center text-white">
                  <Calendar className="w-5 h-5 mr-3 text-purple-400" />
                  <span className="text-gray-200">
                    {formatEventDateTime(event.startDate, event.endDate)}
                  </span>
                </div>
                <div className="flex items-center text-white">
                  <UserCheck className="w-5 h-5 mr-3 text-purple-400" />
                  <span className="text-gray-200">
                    Age Limit - {formatAgeLimit(event.minAge, event.maxAge)}
                  </span>
                </div>
                <div className="flex items-center text-white">
                  <Users className="w-5 h-5 mr-3 text-purple-400" />
                  <span className="text-gray-200">
                    Crowd Size - {event.maxTickets}
                  </span>
                </div>

                <div className="flex items-start text-white">
                  <MapPin className="w-5 h-5 mr-3 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div className="text-gray-200">
                    <span>{event.city || event.location}</span>
                    {event.landmark && (
                      <p className="text-xs text-gray-400 mt-1">
                        Near: {event.landmark}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-700 pt-4">
                <div className="flex items-center justify-between mb-4">
                  {event.packages.length > 0 ? (
                    <span className="text-2xl font-bold text-yellow-400">
                      From ₹
                      {(() => {
                        const minPackage = event.packages.reduce(
                          (min: any, pkg: any) =>
                            toNumber(pkg.price) < toNumber(min.price)
                              ? pkg
                              : min
                        );
                        return toNumber(minPackage.price).toFixed(2);
                      })()}
                    </span>
                  ) : (
                    <Skeleton className="h-8 w-24 bg-gray-700" />
                  )}
                  <Badge
                    variant="secondary"
                    className="bg-purple-600/20 text-purple-300 border-purple-600/30"
                  >
                    {event.packages.length} packages
                  </Badge>
                </div>

                <div className="space-y-3">
                  <Button
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                    onClick={handleBookingClick}
                    disabled={isBookingDisabled()}
                  >
                    {getBookingButtonText()}
                  </Button>
                  {inviteStatus === "APPROVED" && (
                    <div className="text-center text-sm text-green-400 bg-green-400/10 border border-green-400/20 rounded-lg p-2">
                      Your request has been accepted. You can now book this
                      event.
                    </div>
                  )}
                  {inviteStatus === "PENDING" && (
                    <div className="text-center text-sm text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-2">
                      Your request is pending approval from the host.
                    </div>
                  )}
                  {inviteStatus === "REJECTED" && (
                    <div className="text-center text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg p-2">
                      Your request was not approved. Please contact the host for
                      more information.
                    </div>
                  )}
                  {calculatedEventStatus === "FULL_HOUSE" && (
                    <div className="text-center text-sm text-purple-400 bg-purple-400/10 border border-purple-400/20 rounded-lg p-2">
                      This event is sold out. No more tickets available.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {inviteForm && (
        <DynamicInviteForm
          open={showInviteDialog}
          onOpenChange={setShowInviteDialog}
          inviteForm={inviteForm}
          eventId={event.id}
          userId={user?.id || ""}
          onSuccess={handleInviteSuccess}
        />
      )}

      {/* Connect Features Popup */}
      <Dialog open={showConnectPopup} onOpenChange={handleClosePopup}>
        <DialogContent className="bg-gray-900 border-purple-500/30 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white text-center mb-2">
              {showPurchaseRequired
                ? "Purchase Required"
                : "Join & Connect Features"}
            </DialogTitle>
            <DialogDescription className="text-gray-300 text-center">
              {showPurchaseRequired
                ? "You need to purchase event tickets to access the connect features"
                : "Discover amazing benefits when you connect with fellow attendees!"}
            </DialogDescription>
          </DialogHeader>

          {!showPurchaseRequired ? (
            <div className="space-y-4 py-4">
              <div className="flex items-start space-x-4 p-4 bg-purple-600/10 border border-purple-500/20 rounded-lg">
                <div className="flex-shrink-0">
                  <UserPlus className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-1">
                    Connect with Event Attendees
                  </h4>
                  <p className="text-sm text-gray-300">
                    Meet like-minded people attending the same event and expand
                    your network.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-pink-600/10 border border-pink-500/20 rounded-lg">
                <div className="flex-shrink-0">
                  <MessageSquare className="w-6 h-6 text-pink-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-1">
                    Chat and Share Conversations
                  </h4>
                  <p className="text-sm text-gray-300">
                    Start conversations, share experiences, and build meaningful
                    connections.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-green-600/10 border border-green-500/20 rounded-lg">
                <div className="flex-shrink-0">
                  <HandHeart className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-1">
                    Join Together & Create Memories
                  </h4>
                  <p className="text-sm text-gray-300">
                    Coordinate with others, plan group activities, and make the
                    most of your event experience.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-center p-8 bg-red-600/10 border border-red-500/20 rounded-lg">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
                    <UserPlus className="w-8 h-8 text-red-400" />
                  </div>
                  <h4 className="font-semibold text-white mb-2">
                    Ticket Required
                  </h4>
                  <p className="text-sm text-gray-300">
                    You haven't purchased any tickets for this event yet.
                    Purchase tickets to unlock the connect features and start
                    networking with other attendees.
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:space-x-2">
            <Button
              variant="outline"
              onClick={handleClosePopup}
              className="border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              {showPurchaseRequired ? "Close" : "Maybe Later"}
            </Button>
            <Button
              onClick={
                showPurchaseRequired
                  ? handlePurchaseFromPopup
                  : handleContinueToConnect
              }
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {showPurchaseRequired
                ? "Purchase Tickets"
                : "Continue to Connect"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Only show footer when not in PWA mode */}
      {isClient && !isPWA && <Footer />}
    </PWAContentWrapper>
  );
}

export function loading() {
  return <EventSkeleton />;
}
