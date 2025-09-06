"use client";

import Image from "next/image";
import Link from "next/link";
import { Calendar, Clock, MapPin, Users, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { EventStatusWithLogic } from "@/components/events/event-status-badge";
import { format } from "date-fns";

interface EventCardProps {
  event: {
    id: string;
    title: string;
    image: string;
    date: string;
    time: string;
    startDate: Date;
    endDate?: Date;
    location: string;
    price?: string;
    organizer: string;
    tags?: string[];
    type?: "normal" | "invite-only";
    slug?: string;
    averageRating?: number;
    totalReviews?: number;
    status?: string;
    maxTickets?: number;
    soldTickets?: number;
  };
}

export function EventCard({ event }: EventCardProps) {
  const router = useRouter();
  const formattedPrice = event.price?.replace("$", "₹");
  const eventUrl = `/events/${event.slug || event.id}`;

  // Format date and time on client side to handle timezone correctly
  const formattedDate = format(new Date(event.startDate), "dd/MM/yyyy");
  const formattedTime = format(new Date(event.startDate), "h:mm a");

  const handleBookNow = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(eventUrl);
  };

  return (
    <Link href={eventUrl}>
      <div className="group relative bg-black/40 backdrop-blur-sm rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/20 hover:scale-[1.02] border border-white/10 cursor-pointer">
        <div className="relative overflow-hidden aspect-[16/10]">
          <Image
            src={event.image || "/placeholder.svg"}
            alt={event.title}
            width={800}
            height={500}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            priority
          />
          {event.type === "invite-only" && (
            <Badge className="absolute top-3 right-3 bg-accent/90 text-black font-semibold backdrop-blur-sm">
              Invite Only
            </Badge>
          )}
          {event.status &&
            event.maxTickets &&
            event.soldTickets &&
            event.startDate &&
            event.endDate && (
              <div className="absolute top-3 left-3">
                <EventStatusWithLogic
                  event={{
                    id: event.id,
                    status: event.status as any,
                    startDate: new Date(event.startDate),
                    endDate: new Date(event.endDate),
                    maxTickets: event.maxTickets,
                    soldTickets: event.soldTickets,
                  }}
                  showIcon={true}
                  useCalculatedStatus={true}
                />
              </div>
            )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-80" />
        </div>

        <div className="p-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            {event.tags?.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-xs bg-primary/20 text-primary border border-primary/20 backdrop-blur-sm"
              >
                {tag}
              </Badge>
            ))}
          </div>

          <h3 className="text-xl font-bold text-white leading-tight tracking-tight group-hover:text-primary transition-colors">
            {event.title}
          </h3>

          <p className="text-sm font-medium text-white/60">
            Hosted by <span className="text-primary">{event.organizer}</span>
          </p>

          <div className="space-y-2.5 text-sm text-white/70">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span>{formattedDate}</span>
              <Clock className="w-4 h-4 text-primary ml-2" />
              <span>{formattedTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span>{event.location}</span>
            </div>

            {event.averageRating !== undefined &&
              event.totalReviews !== undefined &&
              event.totalReviews > 0 && (
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-yellow-400 font-medium">
                      {event.averageRating.toFixed(1)}
                    </span>
                    <span className="text-white/50">
                      ({event.totalReviews} review
                      {event.totalReviews !== 1 ? "s" : ""})
                    </span>
                  </div>
                </div>
              )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <span className="text-2xl font-bold text-primary">
              {formattedPrice}
            </span>
            <Button
              className="bg-primary hover:bg-primary/90 text-black font-semibold shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-primary/40"
              onClick={handleBookNow}
            >
              Book Now
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}
