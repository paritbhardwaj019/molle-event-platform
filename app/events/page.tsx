import { format } from "date-fns";
import { getAllEvents } from "@/lib/actions/event";
import { EventCard } from "@/components/event-card";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { EventType } from "@prisma/client";

export const metadata = {
  title: "Events | Molle",
  description: "Browse and book events on Molle",
};

async function getEvents() {
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

export default async function EventsPage() {
  const events = await getEvents();

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-primary/60">
                All Events
              </span>
            </h1>
            <p className="text-white/60">
              Browse and book from our curated collection of events
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>

          {events.length === 0 && (
            <div className="text-center py-12">
              <p className="text-white/60">No events found</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
