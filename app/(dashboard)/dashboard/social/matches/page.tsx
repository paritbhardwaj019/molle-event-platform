"use client";

import { useState, useEffect } from "react";
import { useLoggedInUser } from "@/lib/hooks/use-logged-in-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Heart,
  MessageCircle,
  Calendar,
  Search,
  Filter,
  Users,
  Clock,
  Sparkles,
  Star,
  Crown,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";
import { getMyDatingKyc } from "@/lib/actions/dating";
import { KycVerificationDialog } from "@/components/social/kyc-verification-dialog";

interface Match {
  id: string;
  conversationId: string;
  matchedAt: string;
  matchedViaEvent: boolean;
  user: {
    id: string;
    name: string;
    avatar?: string;
    age?: number;
    bio?: string;
    interests: string[];
    connectionTypes: string[];
    hasBadge?: boolean;
  };
  lastMessage?: {
    id: string;
    content: string;
    createdAt: string;
    isFromMe: boolean;
    isRead: boolean;
  };
  hasUnreadMessages: boolean;
}

export default function MyMatchesPage() {
  const { user } = useLoggedInUser();
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "recent" | "unread">(
    "all"
  );
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [showKycDialog, setShowKycDialog] = useState(false);
  const [pendingChatAction, setPendingChatAction] = useState<
    (() => void) | null
  >(null);

  // Fetch matches
  const fetchMatches = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/social/matches");
      const data = await response.json();

      if (data.success) {
        setMatches(data.data);
      } else {
        toast.error(data.error || "Failed to load matches");
      }
    } catch (error) {
      console.error("Failed to fetch matches:", error);
      toast.error("Failed to load matches");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch KYC status
  const fetchKycStatus = async () => {
    try {
      const result = await getMyDatingKyc();
      if (result.success) {
        setKycStatus(result.data?.status || "NOT_STARTED");
      }
    } catch (error) {
      console.error("Failed to fetch KYC status:", error);
      setKycStatus("NOT_STARTED");
    }
  };

  useEffect(() => {
    if (user) {
      fetchMatches();
      fetchKycStatus();
    }
  }, [user]);

  // Filter matches based on search and filter type
  const filteredMatches = matches.filter((match) => {
    const matchesSearch = match.user.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    switch (filterType) {
      case "recent":
        const matchDate = new Date(match.matchedAt);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return matchesSearch && matchDate > weekAgo;
      case "unread":
        return matchesSearch && match.hasUnreadMessages;
      default:
        return matchesSearch;
    }
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatLastSeen = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 24) {
      return format(date, "h:mm a");
    } else if (diffInHours < 168) {
      // 7 days
      return format(date, "EEE");
    } else {
      return format(date, "MMM d");
    }
  };

  // Handle chat navigation with KYC check
  const handleChatNavigation = (conversationId: string) => {
    // Check KYC status for starting conversations
    if (kycStatus && kycStatus !== "APPROVED") {
      setPendingChatAction(() => () => {
        window.location.href = `/dashboard/social/chat?conversation=${conversationId}`;
      });
      setShowKycDialog(true);
      return;
    }

    // Navigate directly if KYC is approved or not required
    window.location.href = `/dashboard/social/chat?conversation=${conversationId}`;
  };

  // Handle KYC dialog continue
  const handleKycDialogContinue = () => {
    if (pendingChatAction) {
      pendingChatAction();
      setPendingChatAction(null);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            My Matches
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Connect with people you've matched with
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search matches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant={filterType === "all" ? "default" : "outline"}
              onClick={() => setFilterType("all")}
              size="sm"
            >
              <Users className="w-4 h-4 mr-2" />
              All
            </Button>
            <Button
              variant={filterType === "recent" ? "default" : "outline"}
              onClick={() => setFilterType("recent")}
              size="sm"
            >
              <Clock className="w-4 h-4 mr-2" />
              Recent
            </Button>
            <Button
              variant={filterType === "unread" ? "default" : "outline"}
              onClick={() => setFilterType("unread")}
              size="sm"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Unread
            </Button>
          </div>
        </div>

        {/* Matches Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-3 w-[150px]" />
                  </div>
                </div>
                <Skeleton className="h-20 w-full mb-4" />
                <div className="flex gap-2 mb-4">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
                <Skeleton className="h-10 w-full" />
              </Card>
            ))}
          </div>
        ) : filteredMatches.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                <Heart className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {searchQuery || filterType !== "all"
                  ? "No matches found"
                  : "No matches yet"}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchQuery || filterType !== "all"
                  ? "Try adjusting your search or filters"
                  : "Start swiping in the discover section to find your first match!"}
              </p>
              {!searchQuery && filterType === "all" && (
                <Link href="/dashboard/social/discover">
                  <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                    <Search className="w-4 h-4 mr-2" />
                    Start Discovering
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMatches.map((match) => (
              <Card
                key={match.id}
                className="hover:shadow-lg transition-all duration-200"
              >
                <CardContent className="p-6">
                  {/* User Info */}
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={match.user.avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-500 text-white">
                          {getInitials(match.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      {match.hasUnreadMessages && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {match.user.name}
                          {match.user.age && (
                            <span className="text-gray-500 font-normal">
                              , {match.user.age}
                            </span>
                          )}
                        </h3>
                        {/* Premium Badge */}
                        {match.user.hasBadge && (
                          <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full shadow-sm">
                            <Crown className="w-3 h-3 text-white fill-current" />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Calendar className="w-3 h-3 mr-1" />
                        Matched {formatLastSeen(match.matchedAt)}
                        {match.matchedViaEvent && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            Event Match
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  {match.user.bio && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 line-clamp-3">
                      {match.user.bio}
                    </p>
                  )}

                  {/* Connection Types */}
                  {match.user.connectionTypes.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {match.user.connectionTypes.slice(0, 3).map((type) => (
                          <Badge
                            key={type}
                            variant="outline"
                            className="text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                          >
                            {type.toLowerCase().replace("_", " ")}
                          </Badge>
                        ))}
                        {match.user.connectionTypes.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{match.user.connectionTypes.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Interests */}
                  {match.user.interests.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {match.user.interests.slice(0, 4).map((interest) => (
                          <Badge
                            key={interest}
                            variant="secondary"
                            className="text-xs"
                          >
                            {interest}
                          </Badge>
                        ))}
                        {match.user.interests.length > 4 && (
                          <Badge variant="secondary" className="text-xs">
                            +{match.user.interests.length - 4}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Last Message */}
                  {match.lastMessage && (
                    <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                        {match.lastMessage.isFromMe ? "You: " : ""}
                        {match.lastMessage.content}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formatLastSeen(match.lastMessage.createdAt)}
                      </p>
                    </div>
                  )}

                  {/* Action Button */}
                  <Button
                    onClick={() => handleChatNavigation(match.conversationId)}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    {match.lastMessage ? "Continue Chat" : "Start Chatting"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Stats */}
        {matches.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {matches.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Matches
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {matches.filter((m) => m.hasUnreadMessages).length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Unread Messages
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {
                    matches.filter((m) => {
                      const matchDate = new Date(m.matchedAt);
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return matchDate > weekAgo;
                    }).length
                  }
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  This Week
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* KYC Verification Dialog */}
        <KycVerificationDialog
          isOpen={showKycDialog}
          onClose={() => {
            setShowKycDialog(false);
            setPendingChatAction(null);
          }}
          kycStatus={kycStatus}
          context="chat"
          onContinue={handleKycDialogContinue}
        />
      </div>
    </div>
  );
}
