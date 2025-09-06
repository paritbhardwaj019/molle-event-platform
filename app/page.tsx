import type { Metadata } from "next";
import { getAllEvents } from "@/lib/actions/event";
import { format } from "date-fns";
import { EventType } from "@prisma/client";
import { HomePageClient } from "@/components/home-page-client";

export const metadata: Metadata = {
  title:
    "Molle - Professional Event Management Platform | Host, Manage & Scale Events",
  description:
    "The ultimate event management platform for hosts and admins. Create, manage, and monetize your events with powerful tools, real-time analytics, and seamless attendee experiences.",
  keywords: [
    "event management platform",
    "event hosting platform",
    "event host tools",
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
      "Empower your events with Molle's comprehensive platform. Perfect for hosts and venue managers.",
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

function toNumber(decimal: any): number {
  return decimal ? Number(decimal.toString()) : 0;
}

async function getRecommendedEvents() {
  const result = await getAllEvents();
  if (!result.success || !result.data) {
    return [];
  }

  return result.data.map((event) => {
    let minPrice = "TBA";
    if (event.packages && event.packages.length > 0) {
      const minPackagePrice = Math.min(
        ...event.packages.map((pkg) => toNumber(pkg.price))
      );
      minPrice = `From ₹${minPackagePrice.toFixed(2)}`;
    }

    // Calculate review stats
    const reviews = (event as any).reviews || [];
    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) /
          totalReviews
        : 0;

    return {
      id: event.id,
      title: event.title,
      image: event.coverImage,
      date: format(new Date(event.startDate), "dd/MM/yyyy"), // Keep for backward compatibility but will be overridden on client
      time: format(new Date(event.startDate), "h:mm a"), // Keep for backward compatibility but will be overridden on client
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location,
      price: minPrice,
      organizer: event.organizerName,
      attendees: event.bookings.length,
      maxAttendees: event.maxTickets,
      tags: event.amenities.map((a) => a.amenity.name.toUpperCase()),
      type:
        event.eventType === EventType.NORMAL
          ? ("normal" as const)
          : ("invite-only" as const),
      slug: event.slug,
      averageRating,
      totalReviews,
      status: event.status,
      maxTickets: event.maxTickets,
      soldTickets: event.soldTickets,
    };
  });
}

export default async function HomePage() {
  const recommendedEvents = await getRecommendedEvents();

  return <HomePageClient recommendedEvents={recommendedEvents} />;
}
