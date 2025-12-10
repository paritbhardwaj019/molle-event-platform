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
  Heart,
  X,
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
      className="w-full h-full bg-white dark:bg-gray-900 border-0 rounded-3xl overflow-hidden shadow-2xl"
      style={style}
    >
      <CardContent className="p-0 h-full relative">
        {/* Profile Image - Full Height */}
        <div className="relative h-full w-full">
          <Image
            src={currentPhoto}
            alt={user.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={isTop}
          />

          {/* Gradient Overlay - Stronger at bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

          {/* Navigation Buttons - More visible */}
          {allPhotos.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white border-0 rounded-full w-10 h-10 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  prevPhoto();
                }}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white border-0 rounded-full w-10 h-10 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  nextPhoto();
                }}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </>
          )}

          {/* Photo Indicators - Top center */}
          {allPhotos.length > 1 && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
              {allPhotos.map((_, index) => (
                <button
                  key={index}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    index === currentPhotoIndex
                      ? "bg-white w-8"
                      : "bg-white/40 w-1.5"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentPhotoIndex(index);
                  }}
                />
              ))}
            </div>
          )}

          {/* Profile Info Overlay - Bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-6 pb-4 sm:pb-8 text-white z-10">
            <div className="flex items-start justify-between mb-2 sm:mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                  <h2 className="text-xl sm:text-3xl font-bold">
                    {user.name}
                    {user.age && (
                      <span className="text-lg sm:text-2xl font-normal ml-1.5 sm:ml-2">
                        {user.age}
                      </span>
                    )}
                  </h2>
                  {/* Premium Badge */}
                  {user.hasBadge && (
                    <div className="flex items-center justify-center w-5 h-5 sm:w-7 sm:h-7 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full shadow-lg">
                      <Crown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white fill-current" />
                    </div>
                  )}
                </div>

                {/* Gender and Connection Types */}
                <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-1.5 sm:mb-2">
                  {user.gender && (
                    <Badge
                      variant="secondary"
                      className="text-xs bg-white/25 text-white border-white/40 backdrop-blur-sm px-2 py-0.5"
                    >
                      {user.gender.replace("_", " ").toLowerCase()}
                    </Badge>
                  )}
                  {user.connectionTypes.map((type) => (
                    <Badge
                      key={type}
                      variant="secondary"
                      className="text-xs bg-white/25 text-white border-white/40 backdrop-blur-sm px-2 py-0.5"
                    >
                      {type}
                    </Badge>
                  ))}
                </div>

                {/* Relationship Status */}
                {user.relationshipStatus && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-white/15 text-white border-white/40 backdrop-blur-sm px-2 py-0.5 mb-2"
                  >
                    {user.relationshipStatus}
                  </Badge>
                )}
              </div>

              {/* Interest Score and Like Count - Top Right */}
              <div className="flex flex-col items-end space-y-1 sm:space-y-2 ml-2 sm:ml-4">
                {/* Like Count */}
                {user.likeCount !== undefined && (
                  <div className="flex items-center space-x-0.5 sm:space-x-1 bg-white/20 backdrop-blur-sm rounded-full px-1.5 sm:px-2 py-0.5 sm:py-1">
                    <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-pink-300 fill-current" />
                    <span className="text-xs sm:text-sm font-semibold">
                      {user.likeCount}
                    </span>
                  </div>
                )}

                {/* Interest Score */}
                {user.interestScore && (
                  <div className="flex items-center space-x-0.5 sm:space-x-1 bg-white/20 backdrop-blur-sm rounded-full px-1.5 sm:px-2 py-0.5 sm:py-1">
                    <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-300 fill-current" />
                    <span className="text-xs sm:text-sm font-semibold">
                      {Math.abs(Math.round(user.interestScore * 10) / 10)}%
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Bio */}
            {user.bio && (
              <p className="text-white text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-1 sm:line-clamp-2 leading-relaxed">
                {user.bio}
              </p>
            )}

            {/* Shared Interests */}
            {user.sharedInterests && user.sharedInterests.length > 0 && (
              <div className="mb-1.5 sm:mb-2">
                <div className="flex items-center space-x-1 mb-1 sm:mb-1.5">
                  <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-300" />
                  <span className="text-xs font-medium text-white/90">
                    Shared Interests
                  </span>
                </div>
                <div className="flex flex-wrap gap-0.5 sm:gap-1">
                  {user.sharedInterests.slice(0, 3).map((interest) => (
                    <Badge
                      key={interest}
                      variant="outline"
                      className="text-xs bg-white/20 text-white border-white/30 backdrop-blur-sm px-2 py-0.5"
                    >
                      {interest}
                    </Badge>
                  ))}
                  {user.sharedInterests.length > 3 && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-white/20 text-white border-white/30 backdrop-blur-sm px-2 py-0.5"
                    >
                      +{user.sharedInterests.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Interests */}
            {user.interests && user.interests.length > 0 && (
              <div>
                <div className="flex items-center space-x-1 mb-1 sm:mb-1.5">
                  <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-300" />
                  <span className="text-xs font-medium text-white/90">
                    Interests
                  </span>
                </div>
                <div className="flex flex-wrap gap-0.5 sm:gap-1">
                  {user.interests.slice(0, 4).map((interest) => (
                    <Badge
                      key={interest}
                      variant="outline"
                      className="text-xs bg-white/20 text-white border-white/30 backdrop-blur-sm px-2 py-0.5"
                    >
                      {interest}
                    </Badge>
                  ))}
                  {user.interests.length > 4 && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-white/20 text-white border-white/30 backdrop-blur-sm px-2 py-0.5"
                    >
                      +{user.interests.length - 4}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
