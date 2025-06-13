"use client";

import Image from "next/image";
import { notFound, useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Star,
  Music,
  Car,
  Wifi,
  Camera,
  Shield,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Footer } from "@/components/footer";
import { Skeleton } from "@/components/ui/skeleton";
import { getEventBySlug } from "@/lib/actions/event";
import { format } from "date-fns";
import { useLoggedInUser } from "@/lib/hooks/use-logged-in-user";
import { useEffect, useState } from "react";
import {
  createInviteRequest,
  getInviteStatusForUserAndEvent,
} from "@/lib/actions/invite";
import { InviteStatus } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { use } from "react";

const AMENITY_ICONS = {
  "Sound System": Music,
  Parking: Car,
  "Free WiFi": Wifi,
  "Photo Booth": Camera,
  Security: Shield,
  "Live Music": Volume2,
} as const;

function EventSkeleton() {
  return (
    <div className="min-h-screen bg-[#121212]">
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
            <div className="bg-card rounded-2xl p-6">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-full bg-gray-800 mb-4" />
              ))}
              <Skeleton className="h-12 w-full bg-gray-800 mt-6" />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function toNumber(decimal: any): number {
  return decimal ? Number(decimal.toString()) : 0;
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
  const [instagramHandle, setInstagramHandle] = useState("");
  const [notes, setNotes] = useState("");
  const [inviteStatus, setInviteStatus] = useState<InviteStatus | null>(null);

  useEffect(() => {
    async function fetchEvent() {
      const result = await getEventBySlug(resolvedParams.slug);
      console.log(result);
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
    async function checkInviteStatus() {
      if (!isAuthenticated || !user || !event) return;

      const result = await getInviteStatusForUserAndEvent(user.id, event.id);
      if (result.success && result.data) {
        setInviteStatus(result.data.status);
      }
    }

    checkInviteStatus();
  }, [isAuthenticated, user, event]);

  if (isLoading) {
    return <EventSkeleton />;
  }

  if (!event) {
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

    // Get the ref parameter from the URL if it exists
    const searchParams = new URLSearchParams(window.location.search);
    const refCode = searchParams.get("ref");

    // Construct the booking URL with the ref parameter if it exists
    const bookingUrl = refCode
      ? `/book/${resolvedParams.slug}?ref=${refCode}`
      : `/book/${resolvedParams.slug}`;

    router.push(bookingUrl);
  };

  const handleInviteSubmit = async () => {
    if (!instagramHandle.trim()) {
      toast.error("Instagram handle is required");
      return;
    }

    console.log("instagramHandle", instagramHandle);
    console.log("notes", notes);
    console.log("event", event);
    console.log("user", user);

    try {
      const result = await createInviteRequest({
        userId: user!.id,
        eventId: event.id,
        instagramHandle: instagramHandle.trim(),
        message: notes.trim(),
      });

      if (result.success) {
        setInviteStatus(InviteStatus.PENDING);
        setShowInviteDialog(false);
        setInstagramHandle("");
        setNotes("");
        toast.success("Your invite request has been sent to the host", {
          description: "Please wait for the host to approve your request",
        });
      } else {
        toast.error(result.error || "Failed to send invite request");
      }
    } catch (error) {
      toast.error("An error occurred while sending the invite request");
    }
  };

  const getBookingButtonText = () => {
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
    if (event.eventType === "INVITE_ONLY") {
      return inviteStatus === "PENDING" || inviteStatus === "REJECTED";
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-[#121212]">
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                {event.title}
              </h1>
              <div className="relative rounded-2xl overflow-hidden mb-6">
                <Image
                  src={event.coverImage || "/placeholder.svg"}
                  alt={event.title}
                  width={800}
                  height={500}
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
            </div>

            {/* About Section */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">
                About The Event
              </h2>
              <p className="text-muted-foreground mb-6">{event.description}</p>

              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarImage src={event.host.avatar || undefined} />
                  <AvatarFallback className="bg-purple-50 text-purple-600">
                    {event.host.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-white font-semibold">{event.host.name}</p>
                  <p className="text-muted-foreground text-sm">
                    Event Organizer
                  </p>
                </div>
              </div>
            </div>

            {/* Amenities */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {event.amenities.map((amenityRelation: any) => {
                  const amenity = amenityRelation.amenity;
                  const IconComponent =
                    AMENITY_ICONS[amenity.name as keyof typeof AMENITY_ICONS] ||
                    Shield;

                  return (
                    <div
                      key={amenity.id}
                      className="bg-card rounded-lg p-4 text-center"
                    >
                      <IconComponent className="w-8 h-8 text-primary mx-auto mb-2" />
                      <p className="text-white text-sm">{amenity.name}</p>
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
                {event.packages.map((pkg: any) => (
                  <div key={pkg.id} className="bg-card rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {pkg.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {pkg.description}
                        </p>
                      </div>
                      <span className="text-xl font-bold text-accent-gold">
                        ₹{toNumber(pkg.price)}
                      </span>
                    </div>
                    <ul className="space-y-2 mb-4">
                      {pkg.benefits.map((benefit: string, index: number) => (
                        <li
                          key={index}
                          className="text-sm text-muted-foreground flex items-center"
                        >
                          <span className="mr-2">•</span>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full btn-primary"
                      onClick={handleBookingClick}
                    >
                      {event.eventType === "INVITE_ONLY"
                        ? "Request Booking"
                        : "Book Now"}{" "}
                      ({pkg.maxTickets} tickets max)
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Event Info Card */}
            <div className="bg-card rounded-2xl p-6 sticky top-24">
              <div className="space-y-4 mb-6">
                <div className="flex items-center text-white">
                  <Calendar className="w-5 h-5 mr-3 text-primary" />
                  <span>
                    {format(event.startDate, "EEE do MMM yyyy")} |{" "}
                    {format(event.startDate, "h:mm a")}
                  </span>
                </div>
                <div className="flex items-center text-white">
                  <Clock className="w-5 h-5 mr-3 text-primary" />
                  <span>
                    Age Limit - {event.minAge} to {event.maxAge}
                  </span>
                </div>
                <div className="flex items-center text-white">
                  <Users className="w-5 h-5 mr-3 text-primary" />
                  <span>Capacity - {event.maxTickets}</span>
                </div>
              </div>

              <div className="border-t border-white/10 pt-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-bold text-accent-gold">
                    From ₹
                    {Math.min(
                      ...event.packages.map((p: any) => toNumber(p.price))
                    )}
                  </span>
                  <Badge
                    variant="secondary"
                    className="bg-primary/20 text-primary"
                  >
                    {event.packages.length} packages
                  </Badge>
                </div>

                <div className="space-y-3">
                  <Button
                    className="w-full btn-primary"
                    onClick={handleBookingClick}
                    disabled={isBookingDisabled()}
                  >
                    {getBookingButtonText()}
                  </Button>
                  {inviteStatus === "APPROVED" && (
                    <div className="text-center text-sm text-green-500">
                      Your request has been accepted. You can now book this
                      event.
                    </div>
                  )}
                  {inviteStatus === "PENDING" && (
                    <div className="text-center text-sm text-yellow-500">
                      Your request is pending approval from the host.
                    </div>
                  )}
                  {inviteStatus === "REJECTED" && (
                    <div className="text-center text-sm text-red-500">
                      Your request was not approved. Please contact the host for
                      more information.
                    </div>
                  )}
                  <Button
                    variant="outline"
                    className="w-full border-white/20 text-white hover:bg-white/10"
                  >
                    I'm Interested
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Event Invite</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Instagram Handle *</label>
              <Input
                placeholder="@username"
                value={instagramHandle}
                onChange={(e) => setInstagramHandle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Additional Notes</label>
              <Textarea
                placeholder="Any additional information you'd like to share..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowInviteDialog(false);
                setInstagramHandle("");
                setNotes("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleInviteSubmit}
              disabled={!instagramHandle.trim()}
            >
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}

export function loading() {
  return <EventSkeleton />;
}
