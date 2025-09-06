"use client";

import { EventCard } from "@/components/event-card";
import { Footer } from "@/components/footer";
import { usePWA } from "@/hooks/use-pwa";
import { PWAContentWrapper } from "@/components/pwa-content-wrapper";

interface Event {
  id: string;
  title: string;
  image: string;
  date: string;
  time: string;
  startDate: Date;
  location: string;
  price: string;
  organizer: string;
  tags: string[];
  type: "normal" | "invite-only";
  slug: string;
  averageRating: number;
  totalReviews: number;
}

interface EventsPageClientProps {
  events: Event[];
  city?: string;
}

// Utility function to capitalize city names
function capitalizeCity(city: string): string {
  return city
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function EventsPageClient({ events, city }: EventsPageClientProps) {
  const { isPWA, isClient } = usePWA();
  const formattedCity = city ? capitalizeCity(city) : null;

  return (
    <PWAContentWrapper className="min-h-screen bg-black">
      <main className="container mx-auto px-4 py-12">
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-primary/60">
                {formattedCity ? `Events in ${formattedCity}` : "All Events"}
              </span>
            </h1>
            <p className="text-white/60">
              {formattedCity
                ? `Browse and book events in ${formattedCity}`
                : "Browse and book from our curated collection of events"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>

          {events.length === 0 && (
            <div className="text-center py-12">
              <p className="text-white/60">
                {formattedCity
                  ? `No events found in ${formattedCity}`
                  : "No events found"}
              </p>
            </div>
          )}
        </div>
      </main>
      {/* Only show footer when not in PWA mode */}
      {isClient && !isPWA && <Footer />}
    </PWAContentWrapper>
  );
}
