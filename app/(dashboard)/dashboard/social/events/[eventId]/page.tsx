"use client";

import { useState, useEffect, useCallback } from "react";
import { useLoggedInUser } from "@/lib/hooks/use-logged-in-user";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Users,
  UserCheck,
  UserPlus,
  Clock,
  Send,
  Calendar,
  MapPin,
  Loader2,
  Heart,
  MessageCircle,
  Check,
  X,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { use } from "react";
import { hasUserPurchasedEventTickets } from "@/lib/actions/event";

interface EventAttendee {
  id: string;
  status: string;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
    age?: number;
    bio?: string;
    interests: string[];
    connectionTypes: string[];
    relationshipStatus?: string;
    showLocation?: boolean;
  };
  connectionRequestStatus?: string;
}

interface EventDetails {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  startDate: string;
  location: string;
  attendeeCount: number;
  slug: string;
}

interface ConnectionRequest {
  id: string;
  status: string;
  message?: string;
  createdAt: string;
  expiresAt: string;
  event: {
    id: string;
    title: string;
  };
  user: {
    id: string;
    name: string;
    avatar?: string;
    age?: number;
    bio?: string;
    interests: string[];
    connectionTypes: string[];
  };
}

export default function EventSocialPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const resolvedParams = use(params);
  const { user } = useLoggedInUser();
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAttending, setIsAttending] = useState(false);
  const [attendanceStatus, setAttendanceStatus] =
    useState<string>("INTERESTED");
  const [connectionMessage, setConnectionMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState<EventAttendee | null>(null);
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [connectionRequests, setConnectionRequests] = useState<
    ConnectionRequest[]
  >([]);
  const [showRequests, setShowRequests] = useState(false);
  const [eventLoading, setEventLoading] = useState(true);

  // Fetch event details
  const fetchEvent = useCallback(async () => {
    try {
      setEventLoading(true);
      const response = await fetch(`/api/events/${resolvedParams.eventId}`);
      const data = await response.json();

      if (data.success) {
        setEvent(data.data);
      } else {
        console.error("Failed to fetch event:", data.error);
        toast.error("Failed to load event details");
      }
    } catch (error) {
      console.error("Failed to fetch event:", error);
      toast.error("Failed to load event details");
    } finally {
      setEventLoading(false);
    }
  }, [resolvedParams.eventId]);

  const fetchMyAttendance = useCallback(async () => {
    try {
      const response = await hasUserPurchasedEventTickets(
        resolvedParams.eventId,
        user?.id || ""
      );

      if (response.success) {
        setIsAttending(response?.data?.hasPurchased || false);
      } else {
        console.error("Failed to fetch attendance status:", response.error);
      }
    } catch (error) {
      console.error("Failed to fetch attendance status:", error);
    }
  }, [resolvedParams.eventId, user?.id]);

  const fetchAttendees = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/social/events/${resolvedParams.eventId}/attendees`
      );
      const data = await response.json();

      if (data.success) {
        setAttendees(data.data);
      } else {
        toast.error(data.error || "Failed to load attendees");
      }
    } catch (error) {
      console.error("Failed to fetch attendees:", error);
      toast.error("Failed to load attendees");
    }
  }, [resolvedParams.eventId]);

  const fetchConnectionRequests = useCallback(async () => {
    try {
      const response = await fetch(
        "/api/social/connection-requests?type=received"
      );
      const data = await response.json();

      if (data.success) {
        // Filter requests for this event
        const eventRequests = data.data.filter(
          (req: ConnectionRequest) => req.event.id === resolvedParams.eventId
        );
        setConnectionRequests(eventRequests);
      }
    } catch (error) {
      console.error("Failed to fetch connection requests:", error);
    }
  }, [resolvedParams.eventId]);

  // Join/Leave event
  const handleAttendanceChange = async (status: string) => {
    try {
      const response = await fetch(
        `/api/social/events/${resolvedParams.eventId}/attendees`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (data.success) {
        await Promise.all([fetchMyAttendance(), fetchAttendees()]);
        toast.success("Successfully updated attendance!");
      } else {
        toast.error(data.error || "Failed to update attendance");
      }
    } catch (error) {
      console.error("Failed to update attendance:", error);
      toast.error("Failed to update attendance");
    }
  };

  // Send connection request
  const sendConnectionRequest = async () => {
    if (!selectedUser) return;

    setSendingRequest(true);
    try {
      const response = await fetch("/api/social/connection-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: selectedUser.user.id,
          eventId: resolvedParams.eventId,
          message: connectionMessage,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Connection request sent!");
        setShowConnectionDialog(false);
        setConnectionMessage("");
        setSelectedUser(null);
        fetchAttendees(); // Refresh to show updated request status
      } else {
        toast.error(data.error || "Failed to send connection request");
      }
    } catch (error) {
      console.error("Failed to send connection request:", error);
      toast.error("Failed to send connection request");
    } finally {
      setSendingRequest(false);
    }
  };

  // Respond to connection request
  const respondToRequest = async (
    requestId: string,
    action: "ACCEPT" | "REJECT"
  ) => {
    try {
      const response = await fetch("/api/social/connection-requests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          action === "ACCEPT"
            ? "Connection request accepted!"
            : "Connection request rejected"
        );
        fetchConnectionRequests(); // Refresh requests

        if (action === "ACCEPT") {
          toast.success("🎉 You're now connected! You can start chatting.");
        }
      } else {
        toast.error(data.error || "Failed to respond to request");
      }
    } catch (error) {
      console.error("Failed to respond to request:", error);
      toast.error("Failed to respond to request");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "GOING":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "MAYBE":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "INTERESTED":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getConnectionRequestStatus = (status?: string) => {
    switch (status) {
      case "PENDING":
        return {
          text: "Request Sent",
          color: "bg-yellow-100 text-yellow-800",
          icon: Clock,
        };
      case "ACCEPTED":
        return {
          text: "Connected",
          color: "bg-green-100 text-green-800",
          icon: Check,
        };
      case "REJECTED":
        return {
          text: "Request Declined",
          color: "bg-red-100 text-red-800",
          icon: X,
        };
      default:
        return null;
    }
  };

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      Promise.all([
        fetchEvent(),
        fetchMyAttendance(),
        fetchAttendees(),
        fetchConnectionRequests(),
      ]).finally(() => setIsLoading(false));
    }
  }, [
    user,
    fetchEvent,
    fetchMyAttendance,
    fetchAttendees,
    fetchConnectionRequests,
  ]);

  if (!user) {
    return <div>Loading...</div>;
  }

  if (isLoading || eventLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Event Header */}
        {event && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {event.title}
                  </h1>
                  <div className="flex items-center space-x-4 text-gray-600 dark:text-gray-400">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      {format(
                        new Date(event.startDate),
                        "MMM dd, yyyy 'at' h:mm a"
                      )}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      {event.location}
                    </div>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      {attendees.length} attending
                    </div>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">
                    {event.description}
                  </p>
                </div>

                <div className="flex space-x-3">
                  {connectionRequests.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => setShowRequests(true)}
                      className="relative"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Requests
                      <Badge className="absolute -top-2 -right-2 px-1 min-w-[20px] h-5">
                        {connectionRequests.length}
                      </Badge>
                    </Button>
                  )}

                  {!isAttending ? (
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleAttendanceChange("INTERESTED")}
                        variant="outline"
                      >
                        <Heart className="w-4 h-4 mr-2" />
                        Interested
                      </Button>
                      <Button onClick={() => handleAttendanceChange("GOING")}>
                        <UserCheck className="w-4 h-4 mr-2" />
                        Join Event
                      </Button>
                    </div>
                  ) : (
                    <Badge className={getStatusColor(attendanceStatus)}>
                      {attendanceStatus}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Attendees Section */}
        <div className="grid md:grid-cols-1 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2 text-purple-600" />
                Event Attendees ({attendees.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!isAttending ? (
                <div className="text-center py-12 space-y-4">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Purchase Tickets to See Attendees
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                      You need to purchase tickets for this event to connect
                      with other attendees.
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      if (event?.slug) {
                        window.location.href = `/events/${event.slug}`;
                      } else {
                        toast.error("Unable to redirect to event page");
                      }
                    }}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <UserCheck className="w-4 h-4 mr-2" />
                    Purchase Tickets
                  </Button>
                </div>
              ) : attendees.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <Users className="w-12 h-12 text-gray-400 mx-auto" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      No Other Attendees Yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                      Be the first to connect! Check back later as more people
                      join.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {attendees.map((attendee) => {
                    const requestStatus = getConnectionRequestStatus(
                      attendee.connectionRequestStatus
                    );

                    return (
                      <Card
                        key={attendee.id}
                        className="hover:shadow-lg transition-shadow"
                      >
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            {/* Profile Header */}
                            <div className="flex items-center space-x-3">
                              <Avatar className="w-12 h-12">
                                <AvatarImage src={attendee.user.avatar} />
                                <AvatarFallback className="bg-purple-100 text-purple-700">
                                  {getInitials(attendee.user.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                  {attendee.user.name}
                                </h3>
                                {attendee.user.age && (
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {attendee.user.age} years old
                                  </p>
                                )}
                              </div>
                              <Badge
                                className={getStatusColor(attendee.status)}
                              >
                                {attendee.status}
                              </Badge>
                            </div>

                            {/* Bio */}
                            {attendee.user.bio && (
                              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                                {attendee.user.bio}
                              </p>
                            )}

                            {/* Connection Types */}
                            {attendee.user.connectionTypes.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                                  Looking for
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {attendee.user.connectionTypes.map((type) => (
                                    <Badge
                                      key={type}
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {type.toLowerCase()}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Interests */}
                            {attendee.user.interests.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                                  Interests
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {attendee.user.interests
                                    .slice(0, 4)
                                    .map((interest) => (
                                      <Badge
                                        key={interest}
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        {interest}
                                      </Badge>
                                    ))}
                                  {attendee.user.interests.length > 4 && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      +{attendee.user.interests.length - 4}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Connection Action */}
                            <div className="pt-2">
                              {requestStatus ? (
                                <div
                                  className={`px-3 py-2 rounded-lg ${requestStatus.color} flex items-center justify-center`}
                                >
                                  <requestStatus.icon className="w-4 h-4 mr-2" />
                                  <span className="text-sm font-medium">
                                    {requestStatus.text}
                                  </span>
                                </div>
                              ) : (
                                <Button
                                  onClick={() => {
                                    setSelectedUser(attendee);
                                    setShowConnectionDialog(true);
                                  }}
                                  className="w-full"
                                  variant="outline"
                                >
                                  <UserPlus className="w-4 h-4 mr-2" />
                                  Request to Connect
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Connection Request Dialog */}
        <Dialog
          open={showConnectionDialog}
          onOpenChange={setShowConnectionDialog}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Connection Request</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={selectedUser.user.avatar} />
                    <AvatarFallback>
                      {getInitials(selectedUser.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{selectedUser.user.name}</p>
                    <p className="text-sm text-gray-500">
                      Attending {event?.title}
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="message">Message (Optional)</Label>
                  <Textarea
                    id="message"
                    placeholder="Hi! I'd like to connect at the event..."
                    value={connectionMessage}
                    onChange={(e) => setConnectionMessage(e.target.value)}
                    maxLength={500}
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowConnectionDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={sendConnectionRequest}
                    disabled={sendingRequest}
                  >
                    {sendingRequest ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Send Request
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Connection Requests Dialog */}
        <Dialog open={showRequests} onOpenChange={setShowRequests}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Connection Requests</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {connectionRequests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <Avatar>
                        <AvatarImage src={request.user.avatar} />
                        <AvatarFallback>
                          {getInitials(request.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">{request.user.name}</h4>
                          <span className="text-xs text-gray-500">
                            {format(
                              new Date(request.createdAt),
                              "MMM dd, h:mm a"
                            )}
                          </span>
                        </div>
                        {request.message && (
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            "{request.message}"
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-1">
                            {request.user.connectionTypes.map((type) => (
                              <Badge
                                key={type}
                                variant="outline"
                                className="text-xs"
                              >
                                {type.toLowerCase()}
                              </Badge>
                            ))}
                          </div>
                          {request.status === "PENDING" && (
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  respondToRequest(request.id, "REJECT")
                                }
                              >
                                <X className="w-4 h-4 mr-1" />
                                Decline
                              </Button>
                              <Button
                                size="sm"
                                onClick={() =>
                                  respondToRequest(request.id, "ACCEPT")
                                }
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Accept
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
