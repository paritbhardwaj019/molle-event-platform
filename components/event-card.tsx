"use client";

import Image from "next/image";
import Link from "next/link";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

interface EventCardProps {
  event: {
    id: string;
    title: string;
    image: string;
    date: string;
    time: string;
    location: string;
    price: string;
    organizer: string;
    attendees?: number;
    maxAttendees?: number;
    tags?: string[];
    type?: "normal" | "invite-only";
    slug?: string;
  };
}

export function EventCard({ event }: EventCardProps) {
  const router = useRouter();
  const formattedPrice = event.price.replace("$", "₹");
  const eventUrl = `/events/${event.slug || event.id}`;

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
            width={400}
            height={250}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          {event.type === "invite-only" && (
            <Badge className="absolute top-3 right-3 bg-accent/90 text-black font-semibold backdrop-blur-sm">
              Invite Only
            </Badge>
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
            Organized by <span className="text-primary">{event.organizer}</span>
          </p>

          <div className="space-y-2.5 text-sm text-white/70">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span>{event.date}</span>
              <Clock className="w-4 h-4 text-primary ml-2" />
              <span>{event.time}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span>{event.location}</span>
            </div>
            {event.attendees && event.maxAttendees && (
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <div className="flex items-center gap-1.5">
                  <span>
                    {event.attendees}/{event.maxAttendees}
                  </span>
                  <span className="text-white/50">attending</span>
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
