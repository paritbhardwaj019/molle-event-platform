"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
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
};

export function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [events, setEvents] = useState<FeaturedEvent[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      const result = await getFeaturedEvents();
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
    <div className="relative h-[400px] md:h-[500px] overflow-hidden rounded-2xl mb-8">
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
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />

            <div className="absolute inset-0 flex items-center">
              <div className="container mx-auto px-4">
                <div className="max-w-2xl text-white">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {event.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="bg-primary/80 text-white font-spaceGrotesk"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <h1 className="text-4xl md:text-6xl font-bold mb-2 gradient-text font-spaceGrotesk">
                    {event.title}
                  </h1>
                  <p className="text-xl md:text-2xl mb-6 text-secondary font-spaceGrotesk">
                    {event.subtitle}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 mb-6 text-sm md:text-base font-spaceGrotesk">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{event.location}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-accent-gold font-spaceGrotesk">
                      ₹{event.price}
                    </span>
                    <Button className="btn-primary font-spaceGrotesk">
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Buttons */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white"
        onClick={prevSlide}
      >
        <ChevronLeft className="w-6 h-6" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white"
        onClick={nextSlide}
      >
        <ChevronRight className="w-6 h-6" />
      </Button>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {events.map((_, index) => (
          <button
            key={index}
            className={`w-3 h-3 rounded-full transition-colors ${
              index === currentSlide ? "bg-primary" : "bg-white/30"
            }`}
            onClick={() => setCurrentSlide(index)}
          />
        ))}
      </div>
    </div>
  );
}
