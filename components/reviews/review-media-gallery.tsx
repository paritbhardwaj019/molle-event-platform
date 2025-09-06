"use client";

import { useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ReviewMedia {
  publicId: string;
  secureUrl: string;
  width: number;
  height: number;
  type: "image";
}

interface ReviewMediaGalleryProps {
  media: ReviewMedia[];
  className?: string;
}

export function ReviewMediaGallery({
  media,
  className,
}: ReviewMediaGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (!media || media.length === 0) {
    return null;
  }

  const openModal = (index: number) => {
    setSelectedIndex(index);
  };

  const closeModal = () => {
    setSelectedIndex(null);
  };

  const goToPrevious = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const goToNext = () => {
    if (selectedIndex !== null && selectedIndex < media.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  const selectedMedia = selectedIndex !== null ? media[selectedIndex] : null;

  return (
    <>
      <div className={cn("grid gap-2", className)}>
        {media.length === 1 && (
          <div
            className="relative aspect-video rounded-lg overflow-hidden cursor-pointer group"
            onClick={() => openModal(0)}
          >
            <Image
              src={media[0].secureUrl}
              alt="Review media"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-200"
            />
          </div>
        )}

        {media.length === 2 && (
          <div className="grid grid-cols-2 gap-2">
            {media.map((item, index) => (
              <div
                key={item.publicId}
                className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
                onClick={() => openModal(index)}
              >
                <Image
                  src={item.secureUrl}
                  alt="Review media"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>
            ))}
          </div>
        )}

        {media.length === 3 && (
          <div className="grid grid-cols-2 gap-2">
            <div
              className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
              onClick={() => openModal(0)}
            >
              <Image
                src={media[0].secureUrl}
                alt="Review media"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-200"
              />
            </div>
            <div className="grid grid-rows-2 gap-2">
              {media.slice(1, 3).map((item, index) => (
                <div
                  key={item.publicId}
                  className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
                  onClick={() => openModal(index + 1)}
                >
                  <Image
                    src={item.secureUrl}
                    alt="Review media"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <Dialog open={selectedIndex !== null} onOpenChange={closeModal}>
        <DialogContent className="max-w-4xl w-full h-[80vh] p-0 bg-black border-gray-800">
          {selectedMedia && (
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Close button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={closeModal}
                className="absolute top-4 right-4 z-10 bg-black/50 text-white hover:bg-black/70"
              >
                <X className="w-4 h-4" />
              </Button>

              {/* Navigation buttons */}
              {media.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={goToPrevious}
                    disabled={selectedIndex === 0}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white hover:bg-black/70 disabled:opacity-30"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={goToNext}
                    disabled={selectedIndex === media.length - 1}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white hover:bg-black/70 disabled:opacity-30"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </Button>
                </>
              )}

              {/* Media content */}
              <div className="relative w-full h-full">
                <Image
                  src={selectedMedia.secureUrl}
                  alt="Review media"
                  fill
                  className="object-contain"
                />
              </div>

              {/* Media counter */}
              {media.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {(selectedIndex || 0) + 1} / {media.length}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
