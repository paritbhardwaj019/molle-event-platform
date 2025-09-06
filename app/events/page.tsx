import { format } from "date-fns";
import { getAllEvents } from "@/lib/actions/event";
import { EventType } from "@prisma/client";
import { EventsPageClient } from "@/components/events-page-client";

export const metadata = {
  title: "Events | Molle",
  description: "Browse and book events on Molle",
};

function toNumber(decimal: any): number {
  return decimal ? Number(decimal.toString()) : 0;
}

async function getEvents(searchParams: { city?: string }) {
  const city = searchParams.city;
  const result = await getAllEvents({ city });
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
      location: event.location,
      price: minPrice,
      organizer: event.organizerName,
      tags: event.amenities.map((a) => a.amenity.name.toUpperCase()),
      type:
        event.eventType === EventType.NORMAL
          ? ("normal" as const)
          : ("invite-only" as const),
      slug: event.slug,
      averageRating,
      totalReviews,
    };
  });
}

interface EventsPageProps {
  searchParams: Promise<{ city?: string }>;
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const params = await searchParams;
  const events = await getEvents(params);

  return <EventsPageClient events={events} city={params.city} />;
}
