import type { Metadata } from "next";
import { Header } from "@/components/header";
import { HeroCarousel } from "@/components/hero-carousel";
import { EventCard } from "@/components/event-card";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { getAllEvents } from "@/lib/actions/event";
import { format } from "date-fns";
import { EventType } from "@prisma/client";
import Link from "next/link";

export const metadata: Metadata = {
  title:
    "Molle - Professional Event Management Platform | Host, Manage & Scale Events",
  description:
    "The ultimate event management platform for hosts, organizers, and admins. Create, manage, and monetize your events with powerful tools, real-time analytics, and seamless attendee experiences.",
  keywords: [
    "event management platform",
    "event hosting platform",
    "event organizer tools",
    "event management software",
    "host events online",
    "event ticketing platform",
    "event analytics dashboard",
    "professional event planning",
    "venue management system",
    "event marketing tools",
  ],
  authors: [{ name: "Molle Team" }],
  creator: "Molle",
  publisher: "Molle",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Molle - Professional Event Management Platform",
    description:
      "Empower your events with Molle's comprehensive platform. Perfect for hosts, organizers, and venue managers.",
    url: "https://molle.events",
    siteName: "Molle",
    images: [
      {
        url: "https://molle.events/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Molle Event Management Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Molle - Professional Event Management Platform",
    description:
      "Create, manage, and scale your events with Molle's powerful platform.",
    images: ["https://molle.events/og-image.jpg"],
    creator: "@MolleEvents",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
  generator: "v0.dev",
};

async function getRecommendedEvents() {
  const result = await getAllEvents();
  if (!result.success || !result.data) {
    return [];
  }

  return result.data.map((event) => ({
    id: event.id,
    title: event.title,
    image: event.coverImage,
    date: format(event.startDate, "dd/MM/yyyy"),
    time: format(event.startDate, "h:mm a"),
    location: "TBA",
    price: event.packages[0]?.price
      ? `₹${Number(event.packages[0].price).toLocaleString("en-IN")}`
      : "TBA",
    organizer: event.organizerName,
    attendees: event.bookings.length,
    maxAttendees: event.maxTickets,
    tags: event.amenities.map((a) => a.amenity.name.toUpperCase()),
    type:
      event.eventType === EventType.NORMAL
        ? ("normal" as const)
        : ("invite-only" as const),
    slug: event.slug,
  }));
}

export default async function HomePage() {
  const recommendedEvents = await getRecommendedEvents();

  return (
    <div className="min-h-screen bg-black">
      <main className="container mx-auto px-4 py-12 space-y-16">
        {/* Hero Section */}
        <section className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-primary/20 rounded-3xl blur-3xl opacity-20" />
          <HeroCarousel />
        </section>

        {/* Recommended Events Section */}
        <section className="relative">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-4xl font-bold text-white mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-primary/60">
                Recommended Events
              </span>
            </h2>
            <Link href="/events">
              <Button className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20">
                View All
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
            {recommendedEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
            {recommendedEvents.length === 0 && (
              <div className="col-span-full text-center py-12">
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

      <Footer />
    </div>
  );
}
