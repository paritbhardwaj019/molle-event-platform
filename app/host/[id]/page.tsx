"use client";

import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/ui/star-rating";
import { ReportHostDialog } from "@/components/host/report-host-dialog";
import { FollowersCount } from "@/components/host/followers-count";
import { FollowButton } from "@/components/host/follow-button";
import { getPublicHostProfile } from "@/lib/actions/host";
import {
  Calendar,
  MapPin,
  Users,
  Star,
  Clock,
  Flag,
  MessageCircle,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface PublicHostProfilePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function PublicHostProfilePage({
  params,
}: PublicHostProfilePageProps) {
  const [host, setHost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHostProfile() {
      try {
        const { id } = await params;
        const result = await getPublicHostProfile(id);

        if (!result.success || !result.data) {
          setError("Host not found");
          return;
        }

        setHost(result.data);
      } catch (err) {
        setError("Failed to load host profile");
      } finally {
        setLoading(false);
      }
    }

    fetchHostProfile();
  }, [params]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading host profile...</p>
        </div>
      </div>
    );
  }

  if (error || !host) {
    notFound();
  }

  const stats = host.stats;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Host Header */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                <Avatar className="h-32 w-32 md:h-40 md:w-40">
                  <AvatarImage src={host.avatar || undefined} />
                  <AvatarFallback className="text-2xl">
                    {host.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {host.name}
                  </h1>
                  <p className="text-lg text-gray-600">Event Host</p>
                  <p className="text-sm text-gray-500">
                    Member since {format(new Date(host.createdAt), "MMMM yyyy")}
                  </p>
                </div>

                {host.bio && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">About</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {host.bio}
                    </p>
                  </div>
                )}

                {/* Host Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-center mb-1">
                      <Calendar className="h-5 w-5 text-purple-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalEvents}
                    </p>
                    <p className="text-sm text-gray-600">Events</p>
                  </div>

                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-center mb-1">
                      <Users className="h-5 w-5 text-indigo-600" />
                    </div>
                    <FollowersCount hostId={host.id} />
                    <p className="text-sm text-gray-600">Followers</p>
                  </div>

                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-center mb-1">
                      <Star className="h-5 w-5 text-yellow-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.averageRating.toFixed(1)}
                    </p>
                    <p className="text-sm text-gray-600">Rating</p>
                  </div>

                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-center mb-1">
                      <MessageCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalReviews}
                    </p>
                    <p className="text-sm text-gray-600">Reviews</p>
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 space-y-2">
                <FollowButton
                  hostId={host.id}
                  hostName={host.name}
                  className="w-full"
                  onFollowChange={(isFollowing) => {
                    // Force re-render to update followers count
                    setHost((prev: any) => ({ ...prev }));
                  }}
                />
                <ReportHostDialog hostId={host.id} hostName={host.name}>
                  <Button variant="outline" size="sm" className="w-full">
                    <Flag className="h-4 w-4 mr-2" />
                    Report Host
                  </Button>
                </ReportHostDialog>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* All Events */}
        {host.hostedEvents.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                All Events ({host.hostedEvents.length})
              </CardTitle>
              <CardDescription>Events hosted by {host.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {host.hostedEvents.map((event: any) => {
                  const averageRating =
                    event.reviews.length > 0
                      ? event.reviews.reduce(
                          (sum: number, review: any) => sum + review.rating,
                          0
                        ) / event.reviews.length
                      : 0;

                  const startDate = new Date(event.startDate);
                  const endDate = new Date(event.endDate);
                  const isPastEvent = startDate < new Date();

                  return (
                    <Card key={event.id} className="overflow-hidden">
                      <div className="flex flex-col md:flex-row">
                        {/* Event Image */}
                        <div className="relative w-full md:w-48 h-48 md:h-auto">
                          <Image
                            src={event.coverImage || "/placeholder.jpg"}
                            alt={event.title}
                            fill
                            className="object-cover"
                          />
                          {event.eventType === "INVITE_ONLY" && (
                            <Badge className="absolute top-2 right-2 bg-purple-600">
                              Invite Only
                            </Badge>
                          )}
                          {isPastEvent && (
                            <Badge className="absolute top-2 left-2 bg-gray-600">
                              Past Event
                            </Badge>
                          )}
                        </div>

                        {/* Event Details */}
                        <div className="flex-1 p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 mb-2">
                                {event.title}
                              </h3>
                              <p className="text-gray-600 mb-4">
                                {event.description}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-purple-600">
                                {event.packages.length > 0
                                  ? `₹${event.packages[0].price}`
                                  : "₹0"}
                              </p>
                              {event._count.reviews > 0 && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                  <span className="text-sm text-gray-600">
                                    {averageRating.toFixed(1)} (
                                    {event._count.reviews} reviews)
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-600">
                                {format(startDate, "MMM d, yyyy")}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-600">
                                {format(startDate, "h:mm a")}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-600">
                                {event.location}
                              </span>
                            </div>
                          </div>

                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                              <span className="text-sm text-gray-500">
                                {event.soldTickets} / {event.maxTickets} tickets
                                sold
                              </span>
                            </div>
                            <Link href={`/events/${event.slug}`}>
                              <Button className="bg-purple-600 hover:bg-purple-700">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                View Event
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reviews */}
        {host.reviews.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Reviews ({host.reviews.length})
              </CardTitle>
              <CardDescription>
                What attendees say about {host.name}'s events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {host.reviews.map((review: any) => (
                  <div
                    key={review.id}
                    className="border-b border-gray-200 pb-6 last:border-b-0"
                  >
                    <div className="flex items-start gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={review.user.avatar || undefined} />
                        <AvatarFallback>
                          {review.user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-gray-900">
                            {review.user.name}
                          </h4>
                          <StarRating
                            rating={review.rating}
                            readonly
                            size="sm"
                          />
                          <span className="text-sm text-gray-500">
                            {format(new Date(review.createdAt), "MMM d, yyyy")}
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 mb-2">
                          Event:{" "}
                          <Link
                            href={`/events/${review.event.slug}`}
                            className="font-medium text-purple-600 hover:text-purple-800 hover:underline"
                          >
                            {review.event.title}
                          </Link>
                        </p>

                        {review.comment && (
                          <p className="text-gray-700">{review.comment}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty States */}
        {host.hostedEvents.length === 0 && (
          <Card className="mb-8">
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Events
              </h3>
              <p className="text-gray-600">
                {host.name} doesn't have any events at the moment.
              </p>
            </CardContent>
          </Card>
        )}

        {host.reviews.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Reviews Yet
              </h3>
              <p className="text-gray-600">
                {host.name} hasn't received any reviews yet.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
