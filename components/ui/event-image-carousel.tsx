"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EventImage {
  id: string;
  secureUrl: string;
  order: number;
}

interface EventImageCarouselProps {
  images: EventImage[];
  eventTitle: string;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  className?: string;
}

export function EventImageCarousel({
  images,
  eventTitle,
  autoPlay = true,
  autoPlayInterval = 5000,
  className,
}: EventImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isHovered, setIsHovered] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  }, [images.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex(
      (prevIndex) => (prevIndex - 1 + images.length) % images.length
    );
  }, [images.length]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const toggleAutoPlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying || isHovered || images.length <= 1) return;

    const interval = setInterval(nextSlide, autoPlayInterval);
    return () => clearInterval(interval);
  }, [isPlaying, isHovered, nextSlide, autoPlayInterval, images.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        prevSlide();
      } else if (event.key === "ArrowRight") {
        nextSlide();
      } else if (event.key === " ") {
        event.preventDefault();
        toggleAutoPlay();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide, toggleAutoPlay]);

  if (!images.length) {
    return (
      <div
        className={cn(
          "relative rounded-2xl overflow-hidden bg-gray-800 aspect-video",
          className
        )}
      >
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-400">No images available</p>
        </div>
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <div className={cn("relative rounded-2xl overflow-hidden", className)}>
        <Image
          src={images[0].secureUrl}
          alt={eventTitle}
          width={800}
          height={500}
          className="w-full h-full object-cover"
          priority
        />
      </div>
    );
  }

  return (
    <div
      className={cn("relative rounded-2xl overflow-hidden group", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main image */}
      <div className="relative aspect-video">
        <Image
          src={images[currentIndex].secureUrl}
          alt={`${eventTitle} - Image ${currentIndex + 1}`}
          fill
          className="object-cover transition-opacity duration-500"
          priority={currentIndex === 0}
        />

        {/* Gradient overlay for better text visibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      {/* Navigation arrows */}
      <Button
        variant="ghost"
        size="sm"
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 h-10 w-10 p-0"
        aria-label="Previous image"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 h-10 w-10 p-0"
        aria-label="Next image"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>

      {/* Auto-play toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleAutoPlay}
        className="absolute top-4 right-4 bg-black/50 text-white hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 h-8 w-8 p-0"
        aria-label={isPlaying ? "Pause slideshow" : "Play slideshow"}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>

      {/* Image counter */}
      <div className="absolute top-4 left-4 bg-black/50 text-white px-2 py-1 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {currentIndex + 1} / {images.length}
      </div>

      {/* Dot indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              index === currentIndex
                ? "bg-white scale-125"
                : "bg-white/50 hover:bg-white/80"
            )}
            aria-label={`Go to image ${index + 1}`}
          />
        ))}
      </div>

      {/* Progress bar */}
      {isPlaying && !isHovered && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
          <div
            className="h-full bg-white/80 transition-all duration-100 ease-linear"
            style={{
              width: `${
                ((Date.now() % autoPlayInterval) / autoPlayInterval) * 100
              }%`,
            }}
          />
        </div>
      )}
    </div>
  );
}
