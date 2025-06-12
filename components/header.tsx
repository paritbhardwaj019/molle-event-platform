"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, MapPin, Menu, X, LogOut, User } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAuthenticated, logoutUser } = useLoggedInUser();

  return (
    <header className="bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 text-white sticky top-0 z-50 shadow-xl backdrop-blur-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Logo />

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex items-center space-x-4 flex-1 max-w-2xl mx-8">
            <div className="relative flex-1 group">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                <Search className="text-white/60 w-5 h-5 group-focus-within:text-white/80 transition-colors" />
              </div>
              <Input
                placeholder="Search events, venues, or organizers..."
                className="search-input pl-12 h-12 text-white placeholder:text-white/60 border border-white/20 focus-visible:border-white/50 focus-visible:ring-0 rounded-2xl bg-white/10 backdrop-blur-sm"
              />
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <div className="flex items-center space-x-2 bg-white/10 rounded-full px-4 py-2 hover:bg-white/20 transition-colors">
              <MapPin className="w-4 h-4 text-white/90" />
              <Select defaultValue="mumbai">
                <SelectTrigger className="border-none bg-transparent text-white hover:bg-transparent h-auto p-0 gap-2 [&>svg]:hidden focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="select-dropdown">
                  <SelectItem value="mumbai" className="select-item">
                    Mumbai
                  </SelectItem>
                  <SelectItem value="delhi" className="select-item">
                    Delhi
                  </SelectItem>
                  <SelectItem value="bangalore" className="select-item">
                    Bangalore
                  </SelectItem>
                  <SelectItem value="pune" className="select-item">
                    Pune
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Navigation Links */}
            <nav className="flex items-center space-x-6">
              <Link
                href="/events"
                className="text-white/90 hover:text-white transition-colors text-sm font-medium relative group"
              >
                Upcoming Events
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white transition-all group-hover:w-full"></span>
              </Link>

              <Link
                href="/list-show"
                className="text-white/90 hover:text-white transition-colors text-sm font-medium relative group"
              >
                List your Show
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white transition-all group-hover:w-full"></span>
              </Link>

              <Link
                href="/affiliate"
                className="text-white/90 hover:text-white transition-colors text-sm font-medium relative group"
              >
                Become an Affiliate
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white transition-all group-hover:w-full"></span>
              </Link>
            </nav>

            {/* Conditional User Section */}
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
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-600 text-white font-semibold">
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
                  className="w-56 bg-white border-purple-200 shadow-xl rounded-2xl"
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
                      href="/profile"
                      className="cursor-pointer text-gray-700 hover:text-purple-600 hover:bg-purple-50"
                    >
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => logoutUser()}
                    className="text-gray-700 hover:text-purple-600 hover:bg-purple-50"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login">
                <Button className="bg-white text-purple-700 hover:bg-white/95 font-semibold px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
                  Sign in
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden hover:bg-white/10 rounded-full"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-6 pb-6 border-t border-white/20">
            <div className="flex flex-col space-y-4 mt-6">
              {/* Mobile Search */}
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5 group-focus-within:text-white/80 transition-colors" />
                <Input
                  placeholder="Search events..."
                  className="search-input pl-12 h-12 border border-white/20 focus-visible:border-white/50 focus-visible:ring-0 rounded-2xl bg-white/10 backdrop-blur-sm"
                />
              </div>

              {/* Mobile Location */}
              <div className="bg-white/10 rounded-2xl p-3">
                <Select defaultValue="mumbai">
                  <SelectTrigger className="bg-transparent border-none text-white rounded-full h-auto">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="select-dropdown">
                    <SelectItem value="mumbai" className="select-item">
                      Mumbai
                    </SelectItem>
                    <SelectItem value="delhi" className="select-item">
                      Delhi
                    </SelectItem>
                    <SelectItem value="bangalore" className="select-item">
                      Bangalore
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Mobile Navigation */}
              <Link
                href="/events"
                className="text-white/90 hover:text-white transition-colors py-2 px-4 rounded-lg hover:bg-white/10"
              >
                Upcoming Events
              </Link>
              <Link
                href="/list-show"
                className="text-white/90 hover:text-white transition-colors py-2 px-4 rounded-lg hover:bg-white/10"
              >
                List your Show
              </Link>
              <Link
                href="/affiliate"
                className="text-white/90 hover:text-white transition-colors py-2 px-4 rounded-lg hover:bg-white/10"
              >
                Become an Affiliate
              </Link>

              {/* Mobile User Section */}
              {isAuthenticated && user ? (
                <Link
                  href="/profile"
                  className="text-white/90 hover:text-white transition-colors py-2 px-4 rounded-lg hover:bg-white/10"
                >
                  Profile
                </Link>
              ) : (
                <Link href="/login">
                  <Button className="bg-white text-purple-700 hover:bg-white/95 font-semibold rounded-full mt-2 w-full">
                    Sign in
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
