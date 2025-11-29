"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  MapPin,
  Menu,
  X,
  LogOut,
  User,
  Calendar,
  MessageCircle,
  Clock,
  Users,
  Loader2,
  LayoutDashboard,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Logo } from "@/components/logo";
import { useLoggedInUser } from "@/lib/hooks/use-logged-in-user";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CitySearch } from "@/components/ui/city-search";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";
import { format } from "date-fns";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

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
}

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState("Mumbai");
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const { user, isAuthenticated, logoutUser } = useLoggedInUser();
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const cityFromUrl = searchParams.get("city");
    if (cityFromUrl) {
      const formattedCity = cityFromUrl
        .split(" ")
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(" ");
      setSelectedCity(formattedCity);
    }
  }, [searchParams]);

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    const cityParam = city.toLowerCase();
    router.push(`/events?city=${encodeURIComponent(cityParam)}`);
  };

  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        setShowSearchResults(false);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(
          `/api/search/events?q=${encodeURIComponent(query)}`
        );
        const data = await response.json();

        if (data.success) {
          setSearchResults(data.data || []);
          setShowSearchResults(true);
        } else {
          setSearchResults([]);
          setShowSearchResults(false);
        }
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
        setShowSearchResults(false);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!isAuthenticated) return;

      try {
        const response = await fetch("/api/messages/unread-count");
        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (error) {
        console.error("Failed to fetch unread count:", error);
      }
    };

    fetchUnreadCount();
    // Poll for unread count every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    debouncedSearch(value);
  };

  const handleSearchResultClick = (slug: string) => {
    setShowSearchResults(false);
    setSearchQuery("");
    router.push(`/events/${slug}`);
  };

  const handleLogoutConfirm = () => {
    logoutUser();
    setShowLogoutDialog(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="bg-gradient-to-r from-[#b81ce3] via-[#cc18d9] to-[#e316cd] text-white sticky top-0 z-50 shadow-xl backdrop-blur-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Logo />

          <div className="hidden md:flex items-center space-x-4 flex-1 max-w-2xl mx-8">
            <div className="relative flex-1 group" ref={searchRef}>
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                {isSearching ? (
                  <Loader2 className="text-white/60 w-5 h-5 animate-spin" />
                ) : (
                  <Search className="text-white/60 w-5 h-5 group-focus-within:text-white/80 transition-colors" />
                )}
              </div>
              <Input
                placeholder="Search events by title or host..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="search-input pl-12 h-12 text-white placeholder:text-white/60 border border-white/20 focus-visible:border-white/50 focus-visible:ring-0 rounded-2xl bg-white/10 backdrop-blur-sm transition-all duration-200 focus:bg-white/15"
              />

              {showSearchResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 max-h-96 overflow-y-auto z-50 search-results-dropdown search-results-scroll">
                  {searchResults.length > 0 ? (
                    <div className="p-2">
                      {searchResults.slice(0, 5).map((event) => (
                        <div
                          key={event.id}
                          onClick={() => handleSearchResultClick(event.slug)}
                          className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group search-result-item"
                        >
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                            <Image
                              src={event.coverImage}
                              alt={event.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-200 search-result-image"
                            />
                            {event.isFeatured && (
                              <div className="absolute top-1 right-1 bg-yellow-400 text-yellow-900 text-xs px-1.5 py-0.5 rounded-full font-medium">
                                ★
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 truncate group-hover:text-[#b81ce3] transition-colors">
                              {event.title}
                            </h4>
                            <p className="text-sm text-gray-600 truncate">
                              by {event.organizerName}
                            </p>
                            <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(
                                  new Date(event.startDate),
                                  "MMM d, yyyy"
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {event.bookings.length}/{event.maxTickets}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-[#b81ce3]">
                              {event.packages[0]?.price
                                ? `₹${event.packages[0].price.toLocaleString(
                                    "en-IN"
                                  )}`
                                : "TBA"}
                            </div>
                          </div>
                        </div>
                      ))}
                      {searchResults.length > 5 && (
                        <div className="border-t border-gray-100 mt-2 pt-2">
                          <Link
                            href={`/search?q=${encodeURIComponent(
                              searchQuery
                            )}`}
                            onClick={() => setShowSearchResults(false)}
                            className="block w-full text-center py-3 text-[#b81ce3] hover:bg-[#b81ce3]/5 rounded-xl transition-colors font-medium"
                          >
                            View all {searchResults.length} results →
                          </Link>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-gray-500">
                      <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p>No events found</p>
                      <p className="text-sm">
                        Try searching with different keywords
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <CitySearch
              variant="header"
              value={selectedCity}
              onValueChange={handleCityChange}
              placeholder="Select city"
              className="min-w-[160px]"
            />

            <nav className="flex items-center space-x-6">
              <Link
                href="/events"
                className="text-white/90 hover:text-white transition-colors text-sm font-medium relative group"
              >
                All Events
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white transition-all group-hover:w-full"></span>
              </Link>

              {!isAuthenticated && (
                <>
                  <Link
                    href="/list-show"
                    className="text-white/90 hover:text-white transition-colors text-sm font-medium relative group"
                  >
                    List your Event
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white transition-all group-hover:w-full"></span>
                  </Link>

                  <Link
                    href="/affiliate"
                    className="text-white/90 hover:text-white transition-colors text-sm font-medium relative group"
                  >
                    Become an Affiliate
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white transition-all group-hover:w-full"></span>
                  </Link>
                </>
              )}

              {(!isAuthenticated || user?.role !== "HOST") && (
                <button
                  onClick={() => {
                    if (window.showMolleSwipesOnboarding) {
                      window.showMolleSwipesOnboarding();
                    } else {
                      // Fallback: redirect directly to social discover page
                      if (isAuthenticated) {
                        router.push("/dashboard/social/discover");
                      } else {
                        router.push(
                          "/login?redirectTo=/dashboard/social/discover"
                        );
                      }
                    }
                  }}
                  className="text-white/90 hover:text-white transition-colors text-sm font-medium relative group flex items-center gap-1 cursor-pointer"
                >
                  <Heart className="w-4 h-4" />
                  Molle Swipes
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white transition-all group-hover:w-full"></span>
                </button>
              )}
            </nav>

            {isAuthenticated && <NotificationDropdown className="mr-2" />}

            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center space-x-3 hover:bg-white/10 h-auto p-3 rounded-full transition-all duration-200"
                  >
                    <Avatar className="h-9 w-9 ring-2 ring-white/20">
                      <AvatarImage
                        src={user.avatar || undefined}
                        alt={user.name}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-[#cc18d9] to-[#e316cd] text-white font-semibold">
                        {user.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <div className="text-sm font-semibold text-white">
                        {user.name}
                      </div>
                      <div className="text-xs text-white/70">{user.role}</div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56 bg-white border-[#e316cd]/20 shadow-xl rounded-2xl"
                  align="end"
                  forceMount
                >
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm leading-none text-gray-900">
                        {user.name}
                      </p>
                      <p className="text-xs leading-none text-gray-500">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard"
                      className="cursor-pointer text-gray-700 hover:text-[#e316cd] hover:bg-[#e316cd]/10"
                    >
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/profile"
                      className="cursor-pointer text-gray-700 hover:text-[#e316cd] hover:bg-[#e316cd]/10"
                    >
                      <User className="mr-2 h-4 w-4" />
                      My Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/bookings"
                      className="cursor-pointer text-gray-700 hover:text-[#e316cd] hover:bg-[#e316cd]/10"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      My Bookings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href={
                        user.role === "HOST" || user.role === "ADMIN"
                          ? "/dashboard/messages"
                          : "/chat"
                      }
                      className="cursor-pointer text-gray-700 hover:text-[#e316cd] hover:bg-[#e316cd]/10"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center">
                          <MessageCircle className="mr-2 h-4 w-4" />
                          Messages
                        </div>
                        {unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </span>
                        )}
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => logoutUser()}
                    className="text-gray-700 hover:text-[#e316cd] hover:bg-[#e316cd]/10"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login">
                <Button className="bg-white text-[#b81ce3] hover:bg-white/95 font-semibold px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
                  Sign in/up
                </Button>
              </Link>
            )}
          </div>

          <div className="md:hidden flex items-center gap-2">
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-white/10 rounded-full"
                onClick={() => setShowLogoutDialog(true)}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-white/10 rounded-full"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden mt-6 pb-6 border-t border-white/20">
            <div className="flex flex-col space-y-4 mt-6">
              <div className="relative group">
                {isSearching ? (
                  <Loader2 className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5 animate-spin" />
                ) : (
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5 group-focus-within:text-white/80 transition-colors" />
                )}
                <Input
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="search-input pl-12 h-12 border border-white/20 focus-visible:border-white/50 focus-visible:ring-0 rounded-2xl bg-white/10 backdrop-blur-sm"
                />
              </div>

              {showSearchResults && searchResults.length > 0 && (
                <div className="bg-white/10 rounded-2xl p-3 space-y-2 backdrop-blur-sm">
                  {searchResults.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      onClick={() => handleSearchResultClick(event.slug)}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
                    >
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={event.coverImage}
                          alt={event.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white truncate text-sm">
                          {event.title}
                        </h4>
                        <p className="text-xs text-white/70 truncate">
                          by {event.organizerName}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <CitySearch
                variant="form"
                value={selectedCity}
                onValueChange={handleCityChange}
                placeholder="Select city"
                className="bg-white/10 rounded-2xl p-3"
              />

              <Link
                href="/events"
                className="text-white/90 hover:text-white transition-colors py-2 px-4 rounded-lg hover:bg-white/10"
              >
                All Events
              </Link>
              {!isAuthenticated && (
                <>
                  <Link
                    href="/list-show"
                    className="text-white/90 hover:text-white transition-colors py-2 px-4 rounded-lg hover:bg-white/10"
                  >
                    List your Event
                  </Link>
                  <Link
                    href="/affiliate"
                    className="text-white/90 hover:text-white transition-colors py-2 px-4 rounded-lg hover:bg-white/10"
                  >
                    Become an Affiliate
                  </Link>
                </>
              )}
              {(!isAuthenticated || user?.role !== "HOST") && (
                <button
                  onClick={() => {
                    if (window.showMolleSwipesOnboarding) {
                      window.showMolleSwipesOnboarding();
                    } else {
                      // Fallback: redirect directly to social discover page
                      if (isAuthenticated) {
                        router.push("/dashboard/social/discover");
                      } else {
                        router.push(
                          "/login?redirectTo=/dashboard/social/discover"
                        );
                      }
                    }
                  }}
                  className="text-white/90 hover:text-white transition-colors py-2 px-4 rounded-lg hover:bg-white/10 flex items-center gap-2 cursor-pointer w-full text-left"
                >
                  <Heart className="w-4 h-4" />
                  Molle Swipes
                </button>
              )}

              {isAuthenticated && (
                <div className="flex items-center justify-between py-2 px-4 rounded-lg hover:bg-white/10">
                  <span className="text-white/90 text-sm">Notifications</span>
                  <NotificationDropdown />
                </div>
              )}

              {isAuthenticated && user ? (
                <>
                  <Link
                    href={
                      user.role === "HOST" || user.role === "ADMIN"
                        ? "/dashboard/messages"
                        : "/chat"
                    }
                    className="text-white/90 hover:text-white transition-colors py-2 px-4 rounded-lg hover:bg-white/10 flex items-center justify-between"
                  >
                    <span className="flex items-center">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Messages
                    </span>
                    {unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/dashboard"
                    className="text-white/90 hover:text-white transition-colors py-2 px-4 rounded-lg hover:bg-white/10"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/profile"
                    className="text-white/90 hover:text-white transition-colors py-2 px-4 rounded-lg hover:bg-white/10"
                  >
                    My Profile
                  </Link>
                  <Link
                    href="/bookings"
                    className="text-white/90 hover:text-white transition-colors py-2 px-4 rounded-lg hover:bg-white/10"
                  >
                    My Bookings
                  </Link>
                </>
              ) : (
                <Link href="/login">
                  <Button className="bg-white text-[#b81ce3] hover:bg-white/95 font-semibold rounded-full mt-2 w-full">
                    Sign in/up
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Sign Out</DialogTitle>
            <DialogDescription>
              Are you sure you want to sign out? You will need to log in again
              to access your account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowLogoutDialog(false)}
              className="border-purple-500 text-purple-700 hover:bg-purple-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleLogoutConfirm}
              className="bg-gradient-to-r from-[#b81ce3] via-[#cc18d9] to-[#e316cd] text-white hover:opacity-90"
            >
              Sign Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}

function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
