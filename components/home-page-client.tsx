"use client";

import { HeroCarousel } from "@/components/hero-carousel";
import { EventCard } from "@/components/event-card";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePWA } from "@/hooks/use-pwa";
import { PWAContentWrapper } from "@/components/pwa-content-wrapper";

interface Event {
  id: string;
  title: string;
  image: string;
  date: string;
  time: string;
  startDate: Date;
  endDate: Date;
  location: string;
  price: string;
  organizer: string;
  attendees: number;
  maxAttendees: number;
  tags: string[];
  type: "normal" | "invite-only";
  slug: string;
  averageRating: number;
  totalReviews: number;
  status?: string;
  maxTickets?: number;
  soldTickets?: number;
}

interface HomePageClientProps {
  recommendedEvents: Event[];
}

export function HomePageClient({ recommendedEvents }: HomePageClientProps) {
  const { isPWA, isClient } = usePWA();

  return (
    <PWAContentWrapper className="min-h-screen bg-black">
      <main className="container mx-auto px-4 py-2 space-y-12">
        {/* Hero Section */}
        <section className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-primary/20 rounded-3xl blur-3xl opacity-20" />
          <HeroCarousel />
        </section>

        {/* Latest Events Section */}
        <section className="relative">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-white mb-2">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-primary/60">
                Latest Events
              </span>
            </h2>
            <Link href="/events">
              <Button className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-sm px-4 py-2">
                View All
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendedEvents.slice(0, 4).map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
            {recommendedEvents.length === 0 && (
              <div className="col-span-full text-center py-8">
                <p className="text-white/60">No events found</p>
              </div>
            )}
          </div>
        </section>

        {/* Promo Banner */}
        <section className="relative">
          <div className="relative overflow-hidden bg-gradient-to-r from-primary/80 via-primary to-primary/80 rounded-3xl">
            <div className="absolute inset-0 bg-black mix-blend-overlay opacity-20 bg-cover bg-center" />
            <div className="relative z-10 px-8 py-16 text-center space-y-6">
              <h2 className="text-5xl md:text-7xl font-bold text-white font-spaceGrotesk">
                DISCOVER EVENTS
              </h2>
              <h3 className="text-3xl md:text-5xl font-bold text-white font-spaceGrotesk">
                NEAR YOU
              </h3>
              <p className="text-xl text-black/80 max-w-2xl mx-auto font-spaceGrotesk">
                Find and book the most exciting events happening in your city
              </p>
              <Link href="/events">
                <Button className="mt-4 bg-black text-primary hover:bg-black/90 text-lg px-8 py-6 rounded-full font-semibold">
                  Explore Now
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Only show footer when not in PWA mode */}
      {isClient && !isPWA && <Footer />}
    </PWAContentWrapper>
  );
}
