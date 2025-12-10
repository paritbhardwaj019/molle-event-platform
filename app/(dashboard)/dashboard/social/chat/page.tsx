"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useLoggedInUser } from "@/lib/hooks/use-logged-in-user";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  MessageCircle,
  Send,
  Heart,
  Loader2,
  Users,
  Calendar,
  MoreVertical,
  Flag,
  UserX,
  ExternalLink,
  MapPin,
  Clock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";

interface Match {
  id: string;
  conversationId?: string;
  matchedAt: string;
  matchedViaEvent: boolean;
  user: {
    id: string;
    name: string;
    avatar?: string;
    age?: number;
    role: string;
    bio?: string;
    interests: string[];
    connectionTypes: string[];
    cityId?: string | null;
  };
  currentUserCityId?: string | null;
  lastMessage?: {
    id: string;
    content: string;
    createdAt: string;
    isFromMe: boolean;
    isRead: boolean;
  };
  hasUnreadMessages: boolean;
}

interface Event {
  id: string;
  title: string;
  coverImage?: string | null;
  startDate: string | Date;
  endDate: string | Date;
  location: string;
  city: string;
  slug: string;
  organizerName: string;
  packages?: Array<{
    price: number | any;
  }>;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
}

interface Conversation {
  id: string;
  matchId?: string;
  otherUser: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export default function SocialChatPage() {
  const { user } = useLoggedInUser();
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch user's matches
  const fetchMatches = useCallback(async () => {
    try {
      const response = await fetch("/api/social/matches");
      const data = await response.json();

      if (data.success) {
        setMatches(data.data);

        // Auto-select first match if none selected
        if (data.data.length > 0 && !selectedMatch) {
          setSelectedMatch(data.data[0]);
        }
      } else {
        toast.error(data.error || "Failed to load matches");
      }
    } catch (error) {
      console.error("Failed to fetch matches:", error);
      toast.error("Failed to load matches");
    } finally {
      setIsLoading(false);
    }
  }, [selectedMatch]);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    if (!conversationId) return;

    setIsLoadingMessages(true);
    try {
      const response = await fetch(`/api/social/messages/${conversationId}`);
      const data = await response.json();

      if (data.success) {
        setConversation(data.data.conversation);
        setMessages(data.data.messages);
      } else {
        toast.error(data.error || "Failed to load messages");
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  // Fetch events for user cities
  const fetchEvents = useCallback(async (cities: string[]) => {
    if (cities.length === 0 || !cities.every((city) => city)) {
      setEvents([]);
      return;
    }

    setIsLoadingEvents(true);
    try {
      // Fetch events for each city and combine
      const eventPromises = cities.map(async (city) => {
        try {
          const response = await fetch(
            `/api/events?city=${encodeURIComponent(city)}`
          );
          const data = await response.json();
          return data.success ? data.data || [] : [];
        } catch (error) {
          console.error(`Failed to fetch events for city ${city}:`, error);
          return [];
        }
      });

      const eventArrays = await Promise.all(eventPromises);
      // Flatten and deduplicate by event ID
      const allEvents = eventArrays.flat();
      const uniqueEvents = Array.from(
        new Map(allEvents.map((event: any) => [event.id, event])).values()
      );

      // Filter only upcoming events and sort by start date
      const now = new Date();
      const upcomingEvents = uniqueEvents
        .filter(
          (event: any) => new Date(event.endDate || event.startDate) > now
        )
        .sort(
          (a: any, b: any) =>
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        );

      setEvents(upcomingEvents.slice(0, 10)); // Limit to 10 events
    } catch (error) {
      console.error("Failed to fetch events:", error);
      setEvents([]);
    } finally {
      setIsLoadingEvents(false);
    }
  }, []);

  // Send a message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedMatch?.conversationId || isSending) {
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch(
        `/api/social/messages/${selectedMatch.conversationId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: newMessage.trim() }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setMessages((prev) => [...prev, data.data]);
        setNewMessage("");

        // Update last message in matches list
        setMatches((prev) =>
          prev.map((match) =>
            match.id === selectedMatch.id
              ? {
                  ...match,
                  lastMessage: {
                    id: data.data.id,
                    content: data.data.content,
                    createdAt: data.data.createdAt,
                    isFromMe: true,
                    isRead: true,
                  },
                  hasUnreadMessages: false,
                }
              : match
          )
        );
      } else {
        toast.error(data.error || "Failed to send message");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  // Unmatch user
  const unmatchUser = async (matchId: string) => {
    try {
      const response = await fetch(`/api/social/matches?matchId=${matchId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Successfully unmatched");
        setMatches((prev) => prev.filter((match) => match.id !== matchId));

        if (selectedMatch?.id === matchId) {
          setSelectedMatch(null);
          setConversation(null);
          setMessages([]);
        }
      } else {
        toast.error(data.error || "Failed to unmatch");
      }
    } catch (error) {
      console.error("Failed to unmatch:", error);
      toast.error("Failed to unmatch");
    }
  };

  // Navigate to user profile
  const navigateToUserProfile = (userId: string, userRole: string) => {
    if (userRole === "HOST") {
      router.push(`/host/${userId}`);
    } else {
      router.push(`/profile/${userId}`);
    }
  };

  // Report user
  const reportUser = async (userId: string) => {
    // TODO: Implement reporting functionality
    toast.info("Reporting functionality coming soon");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  useEffect(() => {
    if (user) {
      fetchMatches();
    }
  }, [user, fetchMatches]);

  useEffect(() => {
    if (selectedMatch?.conversationId) {
      fetchMessages(selectedMatch.conversationId);
    }

    // Fetch events when a match is selected
    if (selectedMatch) {
      const cities: string[] = [];
      if (selectedMatch.currentUserCityId) {
        cities.push(selectedMatch.currentUserCityId);
      }
      if (
        selectedMatch.user.cityId &&
        selectedMatch.user.cityId !== selectedMatch.currentUserCityId
      ) {
        cities.push(selectedMatch.user.cityId);
      }
      fetchEvents(cities);
    } else {
      setEvents([]);
    }
  }, [selectedMatch, fetchMessages, fetchEvents]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="h-[calc(100vh-120px)] bg-white dark:bg-gray-900">
      <div className="flex h-full">
        {/* Matches Sidebar */}
        <div className="w-80 border-r bg-gray-50 dark:bg-gray-800/50 flex flex-col">
          <div className="p-4 border-b">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <Heart className="h-5 w-5 mr-2 text-pink-500" />
              Your Matches
            </h1>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4">
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : matches.length === 0 ? (
              <div className="p-4">
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  <Heart className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-lg font-semibold mb-2">No matches yet</p>
                  <p className="text-sm">
                    Start swiping to find your connections!
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-2">
                {matches.map((match) => (
                  <div
                    key={match.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors mb-2 ${
                      selectedMatch?.id === match.id
                        ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700/50"
                    }`}
                    onClick={() => setSelectedMatch(match)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={match.user.avatar} />
                          <AvatarFallback className="bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300">
                            {getInitials(match.user.name)}
                          </AvatarFallback>
                        </Avatar>
                        {match.hasUnreadMessages && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1">
                            <p
                              className="text-sm font-medium text-gray-900 dark:text-white truncate cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                              onClick={() =>
                                navigateToUserProfile(
                                  match.user.id,
                                  match.user.role
                                )
                              }
                            >
                              {match.user.name}
                            </p>
                            <ExternalLink
                              className="w-3 h-3 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 cursor-pointer"
                              onClick={() =>
                                navigateToUserProfile(
                                  match.user.id,
                                  match.user.role
                                )
                              }
                            />
                          </div>
                          {match.lastMessage && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDistanceToNow(
                                new Date(match.lastMessage.createdAt),
                                {
                                  addSuffix: true,
                                }
                              )}
                            </span>
                          )}
                        </div>
                        {match.lastMessage ? (
                          <p
                            className={`text-sm truncate ${
                              match.hasUnreadMessages
                                ? "text-gray-900 dark:text-white font-medium"
                                : "text-gray-500 dark:text-gray-400"
                            }`}
                          >
                            {match.lastMessage.isFromMe ? "You: " : ""}
                            {match.lastMessage.content}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {match.matchedViaEvent
                              ? "Connected at event"
                              : "New match"}{" "}
                            • Start chatting!
                          </p>
                        )}
                        <div className="flex items-center mt-1">
                          {match.matchedViaEvent && (
                            <Badge variant="outline" className="text-xs mr-2">
                              <Calendar className="w-3 h-3 mr-1" />
                              Event
                            </Badge>
                          )}
                          {match.user.age && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {match.user.age}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedMatch ? (
            <div className="flex h-full">
              {/* Main Chat */}
              <div className="flex-1 flex flex-col">
                {/* Chat Header */}
                <div className="p-4 border-b bg-white dark:bg-gray-900">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={selectedMatch.user.avatar} />
                        <AvatarFallback className="bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300">
                          {getInitials(selectedMatch.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3
                            className="font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                            onClick={() =>
                              navigateToUserProfile(
                                selectedMatch.user.id,
                                selectedMatch.user.role
                              )
                            }
                          >
                            {selectedMatch.user.name}
                          </h3>
                          <ExternalLink
                            className="w-4 h-4 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 cursor-pointer"
                            onClick={() =>
                              navigateToUserProfile(
                                selectedMatch.user.id,
                                selectedMatch.user.role
                              )
                            }
                          />
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {selectedMatch.matchedViaEvent
                            ? "Connected at event"
                            : "City match"}{" "}
                          • Matched{" "}
                          {formatDistanceToNow(
                            new Date(selectedMatch.matchedAt),
                            { addSuffix: true }
                          )}
                        </p>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => reportUser(selectedMatch.user.id)}
                          className="text-orange-600 dark:text-orange-400"
                        >
                          <Flag className="w-4 h-4 mr-2" />
                          Report User
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => unmatchUser(selectedMatch.id)}
                          className="text-red-600 dark:text-red-400"
                        >
                          <UserX className="w-4 h-4 mr-2" />
                          Unmatch
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="max-w-sm mx-auto space-y-4">
                        <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto">
                          <MessageCircle className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Start your conversation
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 mt-2">
                            Say hello to {selectedMatch.user.name}!
                            {selectedMatch.user.interests.length > 0 && (
                              <span>
                                {" "}
                                You both like{" "}
                                {selectedMatch.user.interests[0].toLowerCase()}.
                              </span>
                            )}
                          </p>
                        </div>

                        {/* Match Info */}
                        <Card className="text-left">
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-center space-x-3">
                              <Avatar className="w-12 h-12">
                                <AvatarImage src={selectedMatch.user.avatar} />
                                <AvatarFallback>
                                  {getInitials(selectedMatch.user.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <p
                                    className="font-semibold cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                                    onClick={() =>
                                      navigateToUserProfile(
                                        selectedMatch.user.id,
                                        selectedMatch.user.role
                                      )
                                    }
                                  >
                                    {selectedMatch.user.name}
                                  </p>
                                  <ExternalLink
                                    className="w-4 h-4 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 cursor-pointer"
                                    onClick={() =>
                                      navigateToUserProfile(
                                        selectedMatch.user.id,
                                        selectedMatch.user.role
                                      )
                                    }
                                  />
                                </div>
                                {selectedMatch.user.age && (
                                  <p className="text-sm text-gray-500">
                                    {selectedMatch.user.age} years old
                                  </p>
                                )}
                              </div>
                            </div>

                            {selectedMatch.user.bio && (
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                {selectedMatch.user.bio}
                              </p>
                            )}

                            {selectedMatch.user.interests.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                                  Interests
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {selectedMatch.user.interests
                                    .slice(0, 6)
                                    .map((interest) => (
                                      <Badge
                                        key={interest}
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        {interest}
                                      </Badge>
                                    ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isOwn = message.sender.id === user.id;
                      return (
                        <div
                          key={message.id}
                          className={`flex ${
                            isOwn ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div className="flex items-start space-x-2 max-w-xs lg:max-w-md">
                            {!isOwn && (
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={message.sender.avatar} />
                                <AvatarFallback className="text-xs">
                                  {getInitials(message.sender.name)}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div
                              className={`px-4 py-2 rounded-lg ${
                                isOwn
                                  ? "bg-purple-500 text-white"
                                  : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                              <span className="text-xs opacity-70">
                                {new Date(message.createdAt).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </span>
                            </div>
                            {isOwn && (
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={user.avatar || undefined} />
                                <AvatarFallback className="text-xs">
                                  {getInitials(user.name)}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t bg-white dark:bg-gray-900">
                  <div className="flex space-x-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      disabled={isSending}
                      className="flex-1"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || isSending}
                    >
                      {isSending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Events Sidebar */}
              <div className="w-80 border-l bg-gray-50 dark:bg-gray-800/50 flex flex-col">
                <div className="p-4 border-b">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-purple-500" />
                    Events in Your Cities
                  </h2>
                  {(selectedMatch.currentUserCityId ||
                    selectedMatch.user.cityId) && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {[
                        selectedMatch.currentUserCityId,
                        selectedMatch.user.cityId,
                      ]
                        .filter(Boolean)
                        .filter(
                          (city, index, arr) => arr.indexOf(city) === index
                        )
                        .join(" & ")}
                    </p>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  {isLoadingEvents ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                    </div>
                  ) : events.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No upcoming events in your cities
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {events.map((event: any) => {
                        const minPrice =
                          event.packages && event.packages.length > 0
                            ? Math.min(
                                ...event.packages.map((pkg: any) =>
                                  typeof pkg.price === "number"
                                    ? pkg.price
                                    : Number(pkg.price) || 0
                                )
                              )
                            : null;
                        const eventDate = new Date(event.startDate);
                        const isToday =
                          eventDate.toDateString() ===
                          new Date().toDateString();

                        return (
                          <Card
                            key={event.id}
                            className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => router.push(`/book/${event.slug}`)}
                          >
                            <CardContent className="p-0">
                              {event.coverImage && (
                                <div className="relative h-32 w-full overflow-hidden rounded-t-lg">
                                  <img
                                    src={event.coverImage}
                                    alt={event.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <div className="p-3">
                                <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-1 line-clamp-2">
                                  {event.title}
                                </h3>
                                <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                                  <div className="flex items-center">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {isToday
                                      ? "Today"
                                      : eventDate.toLocaleDateString()}{" "}
                                    {eventDate.toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </div>
                                  <div className="flex items-center">
                                    <MapPin className="w-3 h-3 mr-1" />
                                    <span className="truncate">
                                      {event.location}
                                    </span>
                                  </div>
                                  {minPrice && (
                                    <div className="text-purple-600 dark:text-purple-400 font-medium">
                                      From ₹{minPrice}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <MessageCircle className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Select a match to start chatting
                </h3>
                <p className="text-sm">
                  Choose a conversation from the sidebar to continue
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
