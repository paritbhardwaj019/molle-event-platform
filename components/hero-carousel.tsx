"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getFeaturedEvents } from "@/lib/actions/booking";

const parseHtmlContent = (htmlString: string) => {
  const textContent = htmlString
    .replace(/<[^>]*>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  return textContent;
};

type FeaturedEvent = {
  id: string;
  title: string;
  subtitle: string;
  coverImage: string;
  date: string;
  time: string;
  location: string;
  price: number;
  tags: string[];
  slug: string;
};

export function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [events, setEvents] = useState<FeaturedEvent[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      const result = await getFeaturedEvents();
      console.log(result);

      if (result.success && result.data) {
        setEvents(result.data);
      }
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    if (events.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % events.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [events]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % events.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + events.length) % events.length);
  };

  if (events.length === 0) {
    return null;
  }

  return (
    <div className="relative h-[400px] sm:h-[450px] md:h-[500px] overflow-hidden rounded-2xl mb-8">
      {events.map((event, index) => (
        <div
          key={event.id}
          className={`absolute inset-0 transition-transform duration-500 ease-in-out ${
            index === currentSlide
              ? "translate-x-0"
              : index < currentSlide
                ? "-translate-x-full"
                : "translate-x-full"
          }`}
        >
          <div className="relative h-full">
            <Image
              src={event.coverImage || "/placeholder.svg"}
              alt={event.title}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/20" />

            {/* Mobile Layout */}
            <div className="absolute inset-0 flex items-center md:hidden z-10">
              <div className="w-full px-4 py-6">
                <div className="text-white space-y-3">
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {event.tags.slice(0, 2).map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="bg-primary/20 text-white border-primary/30 font-spaceGrotesk text-[10px] px-2 py-1"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Title */}
                  <h1 className="text-xl sm:text-2xl font-bold gradient-text font-spaceGrotesk leading-tight">
                    {event.title}
                  </h1>

                  {/* Subtitle */}
                  <p className="text-xs sm:text-sm text-white/90 font-spaceGrotesk leading-relaxed line-clamp-3">
                    {parseHtmlContent(event.subtitle)}
                  </p>

                  {/* Event Details */}
                  <div className="space-y-1 text-xs font-spaceGrotesk">
                    <div className="flex items-center gap-2 text-white/90">
                      <Calendar className="w-3 h-3 text-primary" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/90">
                      <Clock className="w-3 h-3 text-primary" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/90">
                      <MapPin className="w-3 h-3 text-primary" />
                      <span>{event.location}</span>
                    </div>
                  </div>

                  {/* Price and CTA */}
                  <div className="flex flex-col gap-2 pt-2">
                    <span className="text-lg font-bold text-accent-gold font-spaceGrotesk">
                      ₹{event.price}
                    </span>
                    <Link href={`/events/${event.slug}`} className="w-full">
                      <Button className="btn-primary font-spaceGrotesk w-full text-sm py-2">
                        View Event
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="absolute inset-0 hidden md:flex items-center">
              <div className="container mx-auto px-6 lg:px-8">
                <div className="max-w-3xl text-white">
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {event.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="bg-primary/20 text-white border-primary/30 font-spaceGrotesk text-[10px] px-2 py-1"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Title */}
                  <h1 className="text-2xl lg:text-3xl font-bold mb-3 gradient-text font-spaceGrotesk leading-tight">
                    {event.title}
                  </h1>

                  {/* Subtitle */}
                  <p className="text-sm lg:text-base mb-4 text-white/90 font-spaceGrotesk leading-relaxed max-w-2xl">
                    {parseHtmlContent(event.subtitle)}
                  </p>

                  {/* Event Details */}
                  <div className="flex flex-wrap items-center gap-4 mb-4 text-sm font-spaceGrotesk">
                    <div className="flex items-center gap-2 text-white/90">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/90">
                      <Clock className="w-4 h-4 text-primary" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/90">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>{event.location}</span>
                    </div>
                  </div>

                  {/* Price and CTA */}
                  <div className="flex items-center gap-4">
                    <span className="text-xl font-bold text-accent-gold font-spaceGrotesk">
                      ₹{event.price}
                    </span>
                    <Link href={`/events/${event.slug}`}>
                      <Button className="btn-primary font-spaceGrotesk text-sm px-4 py-2">
                        View Event
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Buttons - Hidden on mobile, visible on desktop */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white hidden md:flex"
        onClick={prevSlide}
      >
        <ChevronLeft className="w-6 h-6" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white hidden md:flex"
        onClick={nextSlide}
      >
        <ChevronRight className="w-6 h-6" />
      </Button>

      {/* Mobile Navigation - Swipe area */}
      <div
        className="absolute inset-0 md:hidden z-0 pointer-events-none"
        onTouchStart={(e) => {
          const startX = e.touches[0].clientX;
          const handleTouchEnd = (e: TouchEvent) => {
            const endX = e.changedTouches[0].clientX;
            const diff = startX - endX;
            if (Math.abs(diff) > 50) {
              if (diff > 0) {
                nextSlide();
              } else {
                prevSlide();
              }
            }
            document.removeEventListener("touchend", handleTouchEnd);
          };
          document.addEventListener("touchend", handleTouchEnd);
        }}
      />

      {/* Mobile Swipe Hint */}
      <div className="absolute top-2 right-2 md:hidden z-10">
        <div className="bg-black/50 text-white text-xs px-2 py-1 rounded-full">
          Swipe →
        </div>
      </div>

      {/* Dots Indicator */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
        {events.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-colors ${
              index === currentSlide ? "bg-primary" : "bg-white/30"
            }`}
            onClick={() => setCurrentSlide(index)}
          />
        ))}
      </div>
    </div>
  );
}
