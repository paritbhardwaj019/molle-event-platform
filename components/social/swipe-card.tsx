"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MapPin,
  Calendar,
  Star,
  Zap,
  Crown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface UserProfile {
  id: string;
  name: string;
  avatar?: string;
  age?: number;
  bio?: string;
  interests: string[];
  photos: string[];
  connectionTypes: string[];
  relationshipStatus?: string;
  showLocation?: boolean;
  cityId?: string;
  interestScore?: number;
  sharedInterests?: string[];
  likeCount?: number;
  hasBadge?: boolean; // New field for badge functionality
  gender?: string; // New field for gender
}

interface SwipeCardProps {
  user: UserProfile;
  onSwipe: (userId: string, action: "LIKE" | "PASS") => void;
  style?: React.CSSProperties;
  isTop?: boolean;
  onLike?: (userId: string) => Promise<{ isMatch?: boolean; error?: string }>;
}

export function SwipeCard({
  user,
  onSwipe,
  style,
  isTop = false,
  onLike,
}: SwipeCardProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // Combine avatar and photos for display
  const allPhotos = [
    ...(user.avatar ? [user.avatar] : []),
    ...(user.photos || []),
  ];

  const currentPhoto = allPhotos[currentPhotoIndex] || "/placeholder-user.jpg";

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % allPhotos.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex(
      (prev) => (prev - 1 + allPhotos.length) % allPhotos.length
    );
  };

  return (
    <Card
      className="w-full h-full bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-lg"
      style={style}
    >
      <CardContent className="p-0 h-full relative">
        {/* Profile Image */}
        <div className="relative h-3/4 w-full">
          <Image
            src={currentPhoto}
            alt={user.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Navigation Buttons */}
          {allPhotos.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white"
                onClick={prevPhoto}
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white"
                onClick={nextPhoto}
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </>
          )}

          {/* Photo Indicators */}
          {allPhotos.length > 1 && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {allPhotos.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentPhotoIndex ? "bg-white" : "bg-white/30"
                  }`}
                  onClick={() => setCurrentPhotoIndex(index)}
                />
              ))}
            </div>
          )}

          {/* Profile Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <h2 className="text-2xl font-bold">
                  {user.name}
                  {user.age && (
                    <span className="text-xl font-normal ml-2">{user.age}</span>
                  )}
                </h2>
                {/* Premium Badge */}
                {user.hasBadge && (
                  <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full shadow-lg">
                    <Crown className="w-4 h-4 text-white fill-current" />
                  </div>
                )}
              </div>

              {/* Interest Score and Like Count */}
              <div className="flex items-center space-x-2">
                {/* Like Count - shows how many people have liked this user */}
                {user.likeCount !== undefined && (
                  <div className="flex items-center space-x-1">
                    <Zap className="w-4 h-4 text-pink-400 fill-current" />
                    <span className="text-sm font-medium">
                      {user.likeCount}
                    </span>
                  </div>
                )}

                {/* Interest Score */}
                {user.interestScore && (
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium">
                      {Math.abs(Math.round(user.interestScore * 10) / 10)}%
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Gender and Connection Types */}
            <div className="flex flex-wrap gap-1 mb-2">
              {user.gender && (
                <Badge
                  variant="secondary"
                  className="text-xs bg-white/20 text-white border-white/30"
                >
                  {user.gender.replace("_", " ").toLowerCase()}
                </Badge>
              )}
              {user.connectionTypes.map((type) => (
                <Badge
                  key={type}
                  variant="secondary"
                  className="text-xs bg-white/20 text-white border-white/30"
                >
                  {type}
                </Badge>
              ))}
            </div>

            {/* Relationship Status */}
            {user.relationshipStatus && (
              <Badge
                variant="outline"
                className="text-xs bg-white/10 text-white border-white/30"
              >
                {user.relationshipStatus}
              </Badge>
            )}
          </div>
        </div>

        {/* Bio Section */}
        <div className="p-6 h-1/4 overflow-y-auto">
          {user.bio && (
            <p className="text-gray-700 dark:text-gray-300 text-sm mb-4 line-clamp-3">
              {user.bio}
            </p>
          )}

          {/* Shared Interests */}
          {user.sharedInterests && user.sharedInterests.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center space-x-1 mb-2">
                <Zap className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Shared Interests
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {user.sharedInterests.slice(0, 3).map((interest) => (
                  <Badge
                    key={interest}
                    variant="outline"
                    className="text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                  >
                    {interest}
                  </Badge>
                ))}
                {user.sharedInterests.length > 3 && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                  >
                    +{user.sharedInterests.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Interests */}
          {user.interests && user.interests.length > 0 && (
            <div>
              <div className="flex items-center space-x-1 mb-2">
                <Star className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Interests
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {user.interests.slice(0, 4).map((interest) => (
                  <Badge
                    key={interest}
                    variant="outline"
                    className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                  >
                    {interest}
                  </Badge>
                ))}
                {user.interests.length > 4 && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                  >
                    +{user.interests.length - 4} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
