"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Footer } from "@/components/footer";
import { EventCard } from "@/components/event-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, SortAsc, SortDesc, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { usePWA } from "@/hooks/use-pwa";
import { PWAContentWrapper } from "@/components/pwa-content-wrapper";

interface SearchResult {
  id: string;
  title: string;
  organizerName: string;
  coverImage: string;
  startDate: string;
  slug: string;
  packages: Array<{ price: number }>;
  bookings: Array<any>;
  maxTickets: number;
  isFeatured: boolean;
  amenities: Array<{ amenity: { name: string } }>;
  location: string;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const { isPWA, isClient } = usePWA();

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState("relevance");
  const [filterBy, setFilterBy] = useState("all");

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/search/events?q=${encodeURIComponent(query)}`
      );
      const data = await response.json();

      if (data.success) {
        setSearchResults(data.data || []);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  const processedResults = searchResults
    .filter((event) => {
      if (filterBy === "all") return true;
      if (filterBy === "featured") return event.isFeatured;
      if (filterBy === "upcoming")
        return new Date(event.startDate) > new Date();
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date-asc":
          return (
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
          );
        case "date-desc":
          return (
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
          );
        case "price-asc":
          return (a.packages[0]?.price || 0) - (b.packages[0]?.price || 0);
        case "price-desc":
          return (b.packages[0]?.price || 0) - (a.packages[0]?.price || 0);
        case "popularity":
          return b.bookings.length - a.bookings.length;
        default: // relevance
          return b.isFeatured ? 1 : -1;
      }
    });

  const eventCards = processedResults.map((event) => ({
    id: event.id,
    title: event.title,
    image: event.coverImage,
    date: format(new Date(event.startDate), "dd/MM/yyyy"),
    time: format(new Date(event.startDate), "h:mm a"),
    location: event.location,
    price: event.packages[0]?.price
      ? `₹${event.packages[0].price.toLocaleString("en-IN")}`
      : "TBA",
    organizer: event.organizerName,
    attendees: event.bookings.length,
    maxAttendees: event.maxTickets,
    tags: event.amenities.map((a) => a.amenity.name.toUpperCase()),
    type: "normal" as const,
    slug: event.slug,
  }));

  return (
    <PWAContentWrapper className="min-h-screen bg-black">
      <main className="container mx-auto px-4 py-12">
        <div className="space-y-8">
          {/* Search Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-white mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-primary/60">
                Search Events
              </span>
            </h1>

            {/* Enhanced Search Form */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="relative group">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                  {isLoading ? (
                    <Loader2 className="text-white/60 w-5 h-5 animate-spin" />
                  ) : (
                    <Search className="text-white/60 w-5 h-5 group-focus-within:text-white/80 transition-colors" />
                  )}
                </div>
                <Input
                  placeholder="Search events by title or host..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input pl-12 h-14 text-white placeholder:text-white/60 border border-white/20 focus-visible:border-white/50 focus-visible:ring-0 rounded-2xl bg-white/10 backdrop-blur-sm transition-all duration-200 focus:bg-white/15 text-lg focus-ring"
                />
                <Button
                  type="submit"
                  className="search-button absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-[#b81ce3] to-[#e316cd] hover:from-[#a01bc4] hover:to-[#d014b8] rounded-xl px-6"
                  disabled={isLoading}
                >
                  Search
                </Button>
              </div>
            </form>
          </div>

          {/* Results Summary and Filters */}
          {searchQuery && (
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/5 rounded-2xl p-6 backdrop-blur-sm">
              <div className="text-white">
                <h2 className="text-xl font-semibold">
                  {isLoading ? (
                    "Searching..."
                  ) : (
                    <>
                      {processedResults.length} result
                      {processedResults.length !== 1 ? "s" : ""}
                      {searchQuery && (
                        <span className="text-white/70">
                          {" "}
                          for "{searchQuery}"
                        </span>
                      )}
                    </>
                  )}
                </h2>
              </div>

              {!isLoading && processedResults.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  <Select value={filterBy} onValueChange={setFilterBy}>
                    <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Events</SelectItem>
                      <SelectItem value="featured">Featured</SelectItem>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white">
                      <SortAsc className="w-4 h-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Relevance</SelectItem>
                      <SelectItem value="date-asc">Date (Earliest)</SelectItem>
                      <SelectItem value="date-desc">Date (Latest)</SelectItem>
                      <SelectItem value="price-asc">
                        Price (Low to High)
                      </SelectItem>
                      <SelectItem value="price-desc">
                        Price (High to Low)
                      </SelectItem>
                      <SelectItem value="popularity">Most Popular</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {/* Search Results */}
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="text-center space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                <p className="text-white/60">Searching for events...</p>
              </div>
            </div>
          ) : processedResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
              {eventCards.map((event) => (
                <div key={event.id} className="event-card">
                  <EventCard event={event} />
                </div>
              ))}
            </div>
          ) : searchQuery ? (
            <div className="text-center py-20">
              <div className="space-y-4">
                <Search className="w-16 h-16 text-white/20 mx-auto" />
                <h3 className="text-2xl font-semibold text-white">
                  No events found
                </h3>
                <p className="text-white/60 max-w-md mx-auto">
                  We couldn't find any events matching "{searchQuery}". Try
                  searching with different keywords or check the spelling.
                </p>
                <Button
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Clear Search
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="space-y-4">
                <Search className="w-16 h-16 text-white/20 mx-auto" />
                <h3 className="text-2xl font-semibold text-white">
                  Start your search
                </h3>
                <p className="text-white/60 max-w-md mx-auto">
                  Enter keywords to find events by title or host name.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
      {/* Only show footer when not in PWA mode */}
      {isClient && !isPWA && <Footer />}
    </PWAContentWrapper>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
