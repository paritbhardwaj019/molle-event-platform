"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLoggedInUser } from "@/lib/hooks/use-logged-in-user";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  User,
  Calendar,
  MapPin,
  Heart,
  Users,
  ArrowLeft,
  Loader2,
  UserCheck,
  Globe,
  Camera,
} from "lucide-react";
import { format } from "date-fns";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

interface UserProfilePageProps {
  params: Promise<{
    id: string;
  }>;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  birthday?: string;
  gender?: string;
  role: string;
  createdAt: string;
  userPreferences?: {
    interests: string[];
    photos: string[];
    connectionTypes: string[];
    showAge: boolean;
    showLocation: boolean;
    cityId?: string;
    bio?: string;
    age?: number;
    gender?: string;
    relationshipStatus?: string;
  };
}

export default function UserProfilePage({ params }: UserProfilePageProps) {
  const router = useRouter();
  const { user: loggedInUser, isLoading: authLoading } = useLoggedInUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserProfile() {
      try {
        const { id } = await params;
        const response = await fetch(`/api/user/${id}/profile`);
        const data = await response.json();

        if (data.success) {
          console.log("DATA @page.tsx LINE 68", data.data);
          setProfile(data.data);
        } else {
          setError(data.error || "Failed to load profile");
        }
      } catch (err) {
        setError("Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserProfile();
  }, [params]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-500" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{error || "Profile not found"}</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatGender = (gender?: string) => {
    if (!gender) return null;
    return gender.replace("_", " ").toLowerCase();
  };

  const formatRelationshipStatus = (status?: string) => {
    if (!status) return null;
    return status.replace("_", " ").toLowerCase();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Chat
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {profile.name}'s Profile
            </h1>
            <p className="text-gray-600">
              {profile.role === "HOST" ? "Event Host" : "User"} • Member since{" "}
              {format(new Date(profile.createdAt), "MMMM yyyy")}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Profile Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Profile Picture */}
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={profile.avatar || undefined} />
                      <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-[#cc18d9] to-[#e316cd] text-white">
                        {getInitials(profile.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {profile.name}
                      </h3>
                      <Badge variant="outline" className="mt-1">
                        {profile.role}
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  {/* Basic Info */}
                  <div className="space-y-4">
                    {/* Birthday */}
                    {profile.birthday && (
                      <div className="flex items-center space-x-3">
                        <Calendar className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-700">
                          Born on{" "}
                          {format(new Date(profile.birthday), "MMMM d, yyyy")}
                        </span>
                      </div>
                    )}

                    {/* Age from preferences if available */}
                    {profile.userPreferences?.showAge &&
                      profile.userPreferences?.age && (
                        <div className="flex items-center space-x-3">
                          <Calendar className="h-5 w-5 text-gray-400" />
                          <span className="text-gray-700">
                            {profile.userPreferences.age} years old
                          </span>
                        </div>
                      )}

                    {/* Gender */}
                    {profile.gender && (
                      <div className="flex items-center space-x-3">
                        <UserCheck className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-700 capitalize">
                          {formatGender(profile.gender)}
                        </span>
                      </div>
                    )}

                    {/* Location */}
                    {profile.userPreferences?.cityId &&
                      profile.userPreferences?.showLocation && (
                        <div className="flex items-center space-x-3">
                          <MapPin className="h-5 w-5 text-gray-400" />
                          <span className="text-gray-700">
                            {profile.userPreferences.cityId}
                          </span>
                        </div>
                      )}

                    {/* Relationship Status */}
                    {profile.userPreferences?.relationshipStatus && (
                      <div className="flex items-center space-x-3">
                        <Heart className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-700 capitalize">
                          {formatRelationshipStatus(
                            profile.userPreferences.relationshipStatus
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Bio */}
                  {(profile.bio || profile.userPreferences?.bio) && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-medium mb-2 text-gray-900">
                          About
                        </h4>
                        <div className="text-gray-700">
                          <RichTextEditor
                            content={
                              profile.bio || profile.userPreferences?.bio || ""
                            }
                            onChange={() => {}} // No-op for read-only
                            editable={false}
                            className="border-0 p-0 bg-transparent prose-sm max-w-none [&_.ProseMirror]:p-0 [&_p]:text-gray-700 [&_strong]:text-gray-900 [&_em]:text-gray-700 [&_ul]:text-gray-700 [&_ol]:text-gray-700 [&_li]:text-gray-700 [&_h1]:text-gray-900 [&_h2]:text-gray-900 [&_h3]:text-gray-900 [&_h4]:text-gray-900 [&_h5]:text-gray-900 [&_h6]:text-gray-900"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Profile Photos */}
                  {profile.userPreferences?.photos &&
                    profile.userPreferences.photos.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="font-medium mb-2 text-gray-900 flex items-center">
                            <Camera className="h-4 w-4 mr-2" />
                            Photos
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                            {profile.userPreferences.photos.map(
                              (photo, index) => (
                                <div
                                  key={index}
                                  className="aspect-square rounded-lg overflow-hidden"
                                >
                                  <img
                                    src={photo}
                                    alt={`${profile.name}'s photo ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </>
                    )}
                </div>
              </CardContent>
            </Card>

            {/* Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Preferences
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Connection Types */}
                  {profile.userPreferences?.connectionTypes &&
                    profile.userPreferences.connectionTypes.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2 text-gray-900 flex items-center">
                          <Heart className="h-4 w-4 mr-2" />
                          Looking for
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {profile.userPreferences.connectionTypes.map(
                            (type) => (
                              <Badge key={type} variant="secondary">
                                {type.toLowerCase()}
                              </Badge>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  {/* Interests */}
                  {profile.userPreferences?.interests &&
                    profile.userPreferences.interests.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2 text-gray-900 flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          Interests
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {profile.userPreferences.interests.map((interest) => (
                            <Badge key={interest} variant="outline">
                              {interest}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Privacy Settings */}
                  <div>
                    <h4 className="font-medium mb-2 text-gray-900">
                      Privacy Settings
                    </h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <span>• Age visibility:</span>
                        <Badge
                          variant={
                            profile.userPreferences?.showAge
                              ? "default"
                              : "secondary"
                          }
                        >
                          {profile.userPreferences?.showAge
                            ? "Public"
                            : "Private"}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span>• Location visibility:</span>
                        <Badge
                          variant={
                            profile.userPreferences?.showLocation
                              ? "default"
                              : "secondary"
                          }
                        >
                          {profile.userPreferences?.showLocation
                            ? "Public"
                            : "Private"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
