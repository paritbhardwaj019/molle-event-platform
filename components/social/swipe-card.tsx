import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MapPin,
  Star,
  Zap,
  Crown,
  ChevronLeft,
  ChevronRight,
  Info,
  X,
  Heart,
} from "lucide-react";
import Image from "next/image";

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
  hasBadge?: boolean;
  gender?: string;
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
  const [showDetails, setShowDetails] = useState(false);

  // Combine avatar and photos for display
  const allPhotos = [
    ...(user.avatar ? [user.avatar] : []),
    ...(user.photos || []),
  ];

  const currentPhoto = allPhotos[currentPhotoIndex] || "/placeholder-user.jpg";

  const nextPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentPhotoIndex((prev) => (prev + 1) % allPhotos.length);
  };

  const prevPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentPhotoIndex(
      (prev) => (prev - 1 + allPhotos.length) % allPhotos.length
    );
  };

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDetails(true);
  };

  return (
    <>
      <Card
        className="w-full h-full bg-white dark:bg-gray-900 border-0 rounded-3xl overflow-hidden shadow-2xl relative"
        style={style}
      >
        <CardContent className="p-0 h-full relative group">
          {/* Profile Image - Full Height */}
          <div className="relative h-full w-full">
            <Image
              src={currentPhoto}
              alt={user.name}
              fill
              className="object-cover pointer-events-none"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={isTop}
            />

            {/* Gradient Overlay - Stronger at bottom */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

            {/* Navigation Areas - Invisible but clickable */}
            <div className="absolute inset-0 flex z-10">
              <div 
                className="w-1/2 h-full cursor-pointer" 
                onClick={prevPhoto}
                onTouchEnd={(e) => {
                  e.stopPropagation(); // Stop touch event from propagating to swipe
                  prevPhoto();
                }}
              />
              <div 
                className="w-1/2 h-full cursor-pointer" 
                onClick={nextPhoto}
                onTouchEnd={(e) => {
                  e.stopPropagation(); // Stop touch event from propagating to swipe
                  nextPhoto();
                }}
              />
            </div>

            {/* Photo Indicators - Top center */}
            {allPhotos.length > 1 && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
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

            {/* Like/Nope Stamps - Visible on Swipe */}
            <div className="absolute top-8 right-8 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="border-4 border-green-500 rounded-lg px-4 py-2 transform rotate-12 bg-green-500/20 backdrop-blur-sm">
                <span className="text-4xl font-bold text-green-500 uppercase tracking-widest">
                  LIKE
                </span>
              </div>
            </div>
            <div className="absolute top-8 left-8 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="border-4 border-red-500 rounded-lg px-4 py-2 transform -rotate-12 bg-red-500/20 backdrop-blur-sm">
                <span className="text-4xl font-bold text-red-500 uppercase tracking-widest">
                  NOPE
                </span>
              </div>
            </div>

            {/* Info Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute bottom-32 right-4 z-30 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white rounded-full w-10 h-10"
              onClick={handleInfoClick}
              onTouchEnd={(e) => {
                e.stopPropagation();
                handleInfoClick(e as any);
              }}
            >
              <Info className="w-5 h-5" />
            </Button>

            {/* Profile Info Overlay - Bottom */}
            <div 
              className="absolute bottom-0 left-0 right-0 p-3 sm:p-6 pb-4 sm:pb-8 text-white z-20 cursor-pointer"
              onClick={handleInfoClick}
              onTouchEnd={(e) => {
                e.stopPropagation();
                handleInfoClick(e as any);
              }}
            >
              <div className="flex items-start justify-between mb-2 sm:mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                    <h2 className="text-2xl sm:text-3xl font-bold">
                      {user.name}
                      {user.age && (
                        <span className="text-xl sm:text-2xl font-normal ml-2">
                          {user.age}
                        </span>
                      )}
                    </h2>
                    {user.hasBadge && (
                      <Crown className="w-5 h-5 text-yellow-400 fill-current" />
                    )}
                  </div>

                  {/* Quick info badges */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {user.gender && (
                      <Badge variant="secondary" className="bg-white/20 text-white border-0">
                        {user.gender.replace("_", " ").toLowerCase()}
                      </Badge>
                    )}
                    {user.cityId && (
                      <div className="flex items-center text-sm text-white/90">
                        <MapPin className="w-4 h-4 mr-1" />
                        {user.cityId}
                      </div>
                    )}
                  </div>
                </div>

                {/* Interest Score */}
                {user.interestScore && (
                  <div className="flex items-center space-x-1 bg-white/20 backdrop-blur-sm rounded-full px-2 py-1">
                    <Star className="w-4 h-4 text-yellow-300 fill-current" />
                    <span className="font-semibold">
                      {Math.round(user.interestScore)}%
                    </span>
                  </div>
                )}
              </div>

              {/* Bio Preview */}
              {user.bio && (
                <p className="text-white/90 text-sm line-clamp-2 leading-relaxed">
                  {user.bio}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expanded Profile Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-md w-full h-[100dvh] sm:h-[90vh] sm:rounded-3xl p-0 gap-0 overflow-hidden bg-white dark:bg-gray-950 border-0 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom duration-300">
          <ScrollArea className="h-full w-full">
            <div className="relative min-h-full pb-32">
              {/* Image Carousel/List */}
              <div className="space-y-1">
                {allPhotos.map((photo, index) => (
                  <div key={index} className="relative w-full aspect-[3/4] sm:aspect-[4/5]">
                    <Image
                      src={photo}
                      alt={`${user.name} photo ${index + 1}`}
                      fill
                      className="object-cover"
                      priority={index === 0}
                    />
                    {/* Gradient for first image to make header text readable if we moved it up, 
                        but we have content below. Keeping subtle gradient for aesthetics. */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent pointer-events-none" />
                  </div>
                ))}
              </div>

              {/* Floating Close Button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-50 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md"
                onClick={() => setShowDetails(false)}
              >
                <X className="w-6 h-6" />
              </Button>

              {/* Content Below Images */}
              <div className="p-6 space-y-6 bg-white dark:bg-gray-950 -mt-6 relative rounded-t-3xl z-10 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
                {/* Header */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold flex items-center gap-2 text-gray-900 dark:text-gray-50">
                      {user.name}
                      {user.age && (
                        <span className="text-2xl font-normal text-gray-500 dark:text-gray-400">
                          {user.age}
                        </span>
                      )}
                    </h2>
                    {user.hasBadge && (
                      <Crown className="w-6 h-6 text-yellow-500 fill-current" />
                    )}
                  </div>
                  
                  {user.cityId && (
                    <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm font-medium">
                      <MapPin className="w-4 h-4 mr-1" />
                      {user.cityId}
                    </div>
                  )}
                </div>

                <div className="h-px bg-gray-100 dark:bg-gray-800" />

                {/* About/Bio */}
                {user.bio && (
                  <div className="space-y-3">
                    <h3 className="font-bold text-gray-900 dark:text-white uppercase tracking-wide text-xs">
                      About Me
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base">
                      {user.bio}
                    </p>
                  </div>
                )}

                {/* Details Grid */}
                {(user.gender || user.relationshipStatus || user.connectionTypes.length > 0) && (
                  <>
                    <div className="h-px bg-gray-100 dark:bg-gray-800" />
                    <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                      {user.gender && (
                        <div>
                          <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Gender</h4>
                          <p className="text-gray-900 dark:text-gray-100 font-medium capitalize">{user.gender.replace(/_/g, " ").toLowerCase()}</p>
                        </div>
                      )}
                      {user.relationshipStatus && (
                        <div>
                          <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Status</h4>
                          <p className="text-gray-900 dark:text-gray-100 font-medium capitalize">{user.relationshipStatus.replace(/_/g, " ").toLowerCase()}</p>
                        </div>
                      )}
                      <div className="col-span-2">
                        <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Looking For</h4>
                        <div className="flex flex-wrap gap-2">
                          {user.connectionTypes.map(t => (
                            <Badge 
                              key={t} 
                              variant="outline" 
                              className="capitalize px-3 py-1 font-medium border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                            >
                              {t.toLowerCase()}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Interests */}
                {user.interests.length > 0 && (
                  <>
                    <div className="h-px bg-gray-100 dark:bg-gray-800" />
                    <div className="space-y-3">
                      <h3 className="font-bold text-gray-900 dark:text-white uppercase tracking-wide text-xs">
                        Interests
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {user.interests.map((interest) => (
                          <Badge
                            key={interest}
                            variant="secondary"
                            className="px-3 py-1.5 text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
                          >
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Shared Interests */}
                {user.sharedInterests && user.sharedInterests.length > 0 && (
                  <>
                    <div className="h-px bg-gray-100 dark:bg-gray-800" />
                    <div className="space-y-3">
                      <h3 className="font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide text-xs flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Shared Interests
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {user.sharedInterests.map((interest) => (
                          <Badge
                            key={interest}
                            variant="outline"
                            className="px-3 py-1.5 text-sm font-medium border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20"
                          >
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </ScrollArea>

          {/* Floating Action Buttons - Fixed at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-6 pt-12 bg-gradient-to-t from-white via-white/90 to-transparent dark:from-gray-950 dark:via-gray-950/90 flex justify-center gap-8 z-50 pointer-events-none">
            <Button
              size="lg"
              variant="outline"
              className="w-16 h-16 rounded-full border-2 border-red-500 bg-white dark:bg-gray-900 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 shadow-xl pointer-events-auto transform transition-transform hover:scale-110 active:scale-95"
              onClick={() => {
                setShowDetails(false);
                onSwipe(user.id, "PASS");
              }}
            >
              <X className="w-8 h-8" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-16 h-16 rounded-full border-2 border-green-500 bg-white dark:bg-gray-900 text-green-500 hover:bg-green-50 dark:hover:bg-green-950 shadow-xl pointer-events-auto transform transition-transform hover:scale-110 active:scale-95"
              onClick={() => {
                setShowDetails(false);
                onSwipe(user.id, "LIKE");
              }}
            >
              <Heart className="w-8 h-8 fill-current" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
