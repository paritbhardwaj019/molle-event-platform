"use client";

import { useLoggedInUser } from "@/lib/hooks/use-logged-in-user";
import { useMessaging } from "@/lib/hooks/use-messaging";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  LogOut,
  User,
  ChevronRight,
  MessageCircle,
  Home,
  LayoutDashboard,
  Calendar,
  BookOpen,
  Users,
  UserPlus,
  HandCoins,
  Star,
  Mail,
  Search,
  MessageCircleIcon,
  Heart,
  Wallet,
  QrCode,
  Shield,
  LinkIcon,
  MapPin,
  Settings,
  Zap,
  BarChart,
  UserCog,
  HelpCircle,
  Ticket,
  Menu,
  X,
  Power,
  UserCheck,
  Bell,
  Crown,
  Lock,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

function Breadcrumb() {
  const pathname = usePathname();
  const paths = pathname.split("/").filter(Boolean);

  return (
    <div className="flex items-center space-x-2 text-sm text-gray-600">
      <Link href="/dashboard" className="hover:text-purple-600">
        Dashboard
      </Link>
      {paths.length > 1 &&
        paths.slice(1).map((path, index) => (
          <div key={path} className="flex items-center space-x-2">
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <Link
              href={`/${paths.slice(0, index + 2).join("/")}`}
              className="capitalize hover:text-purple-600"
            >
              {path}
            </Link>
          </div>
        ))}
    </div>
  );
}

function MobileSidebarItem({
  to,
  icon,
  text,
  badge,
  onItemClick,
}: {
  to: string;
  icon: React.ReactNode;
  text: string;
  badge?: number;
  onItemClick: () => void;
}) {
  const pathname = usePathname();
  const isActive = pathname === to;

  return (
    <li className="flex items-center w-full">
      <Link
        href={to}
        onClick={onItemClick}
        className={`flex items-center w-full font-normal transition-all duration-150 ease-out px-4 py-3 rounded-lg ${
          isActive
            ? "text-purple-600 bg-purple-50"
            : "text-gray-600 hover:text-purple-600 hover:bg-purple-50"
        }`}
      >
        <span
          className={`mr-4 ${isActive ? "text-purple-600" : "text-gray-400"}`}
        >
          {icon}
        </span>
        <span className="text-sm flex-1">{text}</span>
        {badge && badge > 0 && (
          <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700 min-w-[20px] justify-center">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </Link>
    </li>
  );
}

const baseRoutes = {
  HOST: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Events", href: "/dashboard/events", icon: Calendar },
    { name: "Bookings", href: "/dashboard/bookings", icon: BookOpen },
    { name: "Customers", href: "/dashboard/customers", icon: Users },
    { name: "Followers", href: "/dashboard/followers", icon: Users },
    { name: "Referrers", href: "/dashboard/referrers", icon: UserPlus },
    {
      name: "Referrer Codes",
      href: "/dashboard/referrer-codes",
      icon: HandCoins,
    },
    { name: "Reviews", href: "/dashboard/reviews", icon: Star },
    { name: "Messages", href: "/dashboard/messages", icon: Mail },
    {
      name: "Discover People",
      href: "/dashboard/social/discover",
      icon: Search,
    },
    {
      name: "Social Chat",
      href: "/dashboard/social/chat",
      icon: MessageCircleIcon,
    },
    { name: "Invites", href: "/dashboard/invites", icon: Mail },
    { name: "Payments", href: "/dashboard/payments", icon: Wallet },
    { name: "Scan Tickets", href: "/dashboard/scan-ticket", icon: QrCode },
    {
      name: "KYC Verification",
      href: "/dashboard/kyc-verification",
      icon: Shield,
    },
    {
      name: "Invite Forms",
      href: "/dashboard/invite-forms",
      icon: Mail,
    },
  ],
  USER: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    {
      name: "Discover People",
      href: "/dashboard/social/discover",
      icon: Search,
    },
    {
      name: "Social Chat",
      href: "/dashboard/social/chat",
      icon: MessageCircleIcon,
    },
    { name: "My Matches", href: "/dashboard/social/matches", icon: Heart },
  ],
  REFERRER: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Referrals", href: "/dashboard/referrals", icon: HandCoins },
    { name: "Payments", href: "/dashboard/payments", icon: Wallet },
    { name: "Links", href: "/dashboard/links", icon: LinkIcon },
  ],
  ADMIN: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Hosts", href: "/dashboard/hosts", icon: Users },
    { name: "Events", href: "/dashboard/events", icon: Calendar },
    { name: "Bookings", href: "/dashboard/bookings", icon: BookOpen },
    { name: "Referrers", href: "/dashboard/referrers", icon: UserPlus },
    { name: "Messages", href: "/dashboard/messages", icon: Mail },
    { name: "Payments", href: "/dashboard/payments", icon: Wallet },
    { name: "Cities", href: "/dashboard/cities", icon: MapPin },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
    { name: "Links", href: "/dashboard/links", icon: LinkIcon },
    {
      name: "Subscription Packages",
      href: "/dashboard/admin/packages",
      icon: Zap,
    },
    {
      name: "Event Rules",
      href: "/dashboard/admin/event-rules",
      icon: BarChart,
    },
    {
      name: "KYC Requests",
      href: "/dashboard/admin/kyc-requests",
      icon: Shield,
    },
    {
      name: "Dating KYC",
      href: "/dashboard/admin/dating-kyc",
      icon: Shield,
    },
    {
      name: "Reported Hosts",
      href: "/dashboard/admin/reported-hosts",
      icon: UserCog,
    },
    {
      name: "Exclusive Perks",
      href: "/dashboard/exclusive-perks",
      icon: Ticket,
    },
    {
      name: "FAQs",
      href: "/dashboard/admin/faqs",
      icon: HelpCircle,
    },
    {
      name: "Amenities",
      href: "/dashboard/admin/amenities",
      icon: Zap,
    },
    {
      name: "Push Notifications",
      href: "/dashboard/admin/push-notifications",
      icon: Bell,
    },
    // {
    //   name: "Impersonate User",
    //   href: "/dashboard/admin/impersonate",
    //   icon: UserCheck,
    // },
    // {
    //   name: "Manual Ticket Release",
    //   href: "/dashboard/admin/manual-release",
    //   icon: Ticket,
    // },
  ],
};

const getSidebarRoutes = (role: keyof typeof baseRoutes) => {
  return baseRoutes[role] || [];
};

export function Header() {
  const { user, logoutUser } = useLoggedInUser();
  const { unreadCount } = useMessaging();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleLogout = () => {
    logoutUser();
    router.push("/");
    setMenuOpen(false);
    setUserMenuOpen(false);
  };

  if (!user) return null;

  // Hide header on messages page for mobile only
  if (pathname === "/dashboard/messages" && isMobile) return null;

  const navigation = getSidebarRoutes(user.role as keyof typeof baseRoutes);

  return (
    <>
      <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 sm:gap-x-6 sm:px-6 lg:px-8">
        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
          {/* Menu Icon - Always visible */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMenuOpen(true)}
              className="text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          <div className="hidden lg:flex flex-1 items-center ml-12 lg:ml-0">
            <Breadcrumb />
          </div>
          <div className="flex items-center gap-x-4 lg:gap-x-6 ml-auto">
            <div className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
              {user.role}
            </div>

            {/* Messages Button for HOST and ADMIN */}
            {(user.role === "HOST" || user.role === "ADMIN") && (
              <Link href="/dashboard/messages">
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-8 w-8 rounded-full hover:bg-purple-50"
                >
                  <MessageCircle className="h-5 w-5 text-gray-600 hover:text-purple-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-5 w-5 text-xs font-bold text-white bg-red-500 rounded-full">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Button>
              </Link>
            )}

            {/* User Icon - Opens preferences/profile */}
            <Button
              variant="ghost"
              className="relative h-8 w-8 rounded-full hover:bg-purple-50"
              onClick={() => setUserMenuOpen(true)}
            >
              <Avatar className="h-8 w-8 ring-2 ring-purple-100">
                <AvatarImage src={user.avatar || undefined} alt={user.name} />
                <AvatarFallback className="bg-purple-50 text-purple-600">
                  {user.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Menu Sheet */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-80 sm:w-96">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
            <SheetDescription>Navigate to different sections</SheetDescription>
          </SheetHeader>
          <div className="flex flex-col h-full mt-6">
            <div className="flex-1 overflow-y-auto">
              <ul className="space-y-1">
                {navigation.map((item) => (
                  <MobileSidebarItem
                    key={item.href}
                    text={item.name}
                    to={item.href}
                    icon={<item.icon size={20} />}
                    badge={
                      item.name === "Messages"
                        ? unreadCount
                        : (item as any).badge
                    }
                    onItemClick={() => setMenuOpen(false)}
                  />
                ))}
              </ul>
            </div>
            <div className="border-t border-gray-100 pt-4 mt-auto">
              <button
                onClick={handleLogout}
                className="flex items-center w-full py-3 px-4 text-gray-600 hover:text-red-500 hover:bg-red-50 transition-all duration-150 ease-out text-sm rounded-lg"
              >
                <span className="mr-3 text-gray-400">
                  <Power size={19} />
                </span>
                <p className="font-normal text-sm">Logout</p>
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* User Preferences/Profile Sheet */}
      <UserPreferencesSheet
        open={userMenuOpen}
        onOpenChange={setUserMenuOpen}
        user={user}
        onLogout={handleLogout}
      />
    </>
  );
}

// User Preferences Sheet Component
function UserPreferencesSheet({
  open,
  onOpenChange,
  user,
  onLogout,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
  onLogout: () => void;
}) {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (open && user?.role === "USER") {
      fetchLikesData();
    }
  }, [open, user]);

  const fetchLikesData = async () => {
    setIsLoading(true);
    try {
      // Fetch user metrics which includes subscription status and likes count
      const metricsResponse = await fetch("/api/dashboard/user-metrics");
      const metricsData = await metricsResponse.json();
      if (metricsData.isPremium !== undefined) {
        setIsPremium(metricsData.isPremium);
      }
      if (metricsData.totalLikesReceived !== undefined) {
        setLikeCount(metricsData.totalLikesReceived);
      }

      // Also try to fetch unread likes for premium users
      if (metricsData.isPremium) {
        const likesResponse = await fetch("/api/social/unread-likes");
        const likesData = await likesResponse.json();
        if (likesData.success && Array.isArray(likesData.data)) {
          setLikeCount(likesData.data.length);
        }
      }
    } catch (error) {
      console.error("Failed to fetch likes data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:w-80 md:w-96 overflow-y-auto"
      >
        <SheetHeader>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 ring-2 ring-purple-100">
              <AvatarImage src={user?.avatar || undefined} alt={user?.name} />
              <AvatarFallback className="bg-purple-50 text-purple-600">
                {user?.name?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <SheetTitle className="text-base sm:text-lg">
                {user?.name}
              </SheetTitle>
              <SheetDescription className="text-xs">
                {user?.email}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex flex-col h-full mt-6">
          <div className="flex-1 overflow-y-auto space-y-4">
            {/* Quick Links */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Quick Links
              </h3>
              <div className="space-y-1">
                <Link
                  href="/dashboard"
                  onClick={() => onOpenChange(false)}
                  className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-colors"
                >
                  <LayoutDashboard className="mr-3 h-4 w-4" />
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  onClick={() => onOpenChange(false)}
                  className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-colors"
                >
                  <User className="mr-3 h-4 w-4" />
                  My Profile
                </Link>
                {user?.role === "USER" && (
                  <Link
                    href="/dashboard/social/discover"
                    onClick={() => onOpenChange(false)}
                    className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-colors"
                  >
                    <Search className="mr-3 h-4 w-4" />
                    Discover People
                  </Link>
                )}
                {user?.role === "USER" && (
                  <Link
                    href="/dashboard/social/matches"
                    onClick={() => onOpenChange(false)}
                    className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-colors"
                  >
                    <Heart className="mr-3 h-4 w-4" />
                    My Matches
                  </Link>
                )}
                {user?.role === "USER" && (
                  <Link
                    href="/dashboard/social/discover?action=settings"
                    onClick={() => onOpenChange(false)}
                    className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-colors"
                  >
                    <Settings className="mr-3 h-4 w-4" />
                    Profile Settings
                  </Link>
                )}
                {user?.role === "USER" && (
                  <Link
                    href="/dashboard/social/discover?action=delete"
                    onClick={() => onOpenChange(false)}
                    className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                  >
                    <Trash2 className="mr-3 h-4 w-4" />
                    Delete Profile
                  </Link>
                )}
              </div>
            </div>

            {/* See Who Liked You Section - Only for USER role */}
            {user?.role === "USER" && (
              <Card className="border-gray-200">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {!isPremium ? (
                        <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                      ) : (
                        <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500" />
                      )}
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                        See Who Liked You
                      </h3>
                    </div>
                    {!isPremium && (
                      <Badge
                        variant="secondary"
                        className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700"
                      >
                        Premium
                      </Badge>
                    )}
                  </div>

                  {isLoading ? (
                    <div className="text-center py-6">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500 mx-auto"></div>
                      <p className="text-xs sm:text-sm text-gray-600 mt-2">
                        Loading...
                      </p>
                    </div>
                  ) : !isPremium ? (
                    <div className="text-center py-4 sm:py-6 space-y-3 sm:space-y-4">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
                        <Crown className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
                          See Who Liked You
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 px-2">
                          Upgrade to a premium package to see who has liked your
                          profile and swipe back!
                        </p>
                        {likeCount > 0 && (
                          <p className="text-xs sm:text-sm text-purple-600 font-medium mb-3">
                            {likeCount} {likeCount === 1 ? "person" : "people"}{" "}
                            liked you
                          </p>
                        )}
                        <Link
                          href="/dashboard/social/discover"
                          onClick={() => onOpenChange(false)}
                        >
                          <Button
                            size="sm"
                            className="w-full sm:w-auto text-xs sm:text-sm"
                          >
                            Upgrade to Premium
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 sm:py-6">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-pink-100 dark:bg-pink-900/20 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                        <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-pink-500 fill-current" />
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">
                        {likeCount > 0
                          ? `${likeCount} ${
                              likeCount === 1 ? "person" : "people"
                            } liked your profile!`
                          : "No likes yet. Keep swiping!"}
                      </p>
                      <Link
                        href="/dashboard/social/discover"
                        onClick={() => onOpenChange(false)}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto text-xs sm:text-sm"
                        >
                          View Likes
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Back to Homepage - Only for regular users */}
            {user?.role === "USER" && (
              <Link
                href="/"
                onClick={() => onOpenChange(false)}
                className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-colors"
              >
                <Home className="mr-3 h-4 w-4" />
                Back to Homepage
              </Link>
            )}
          </div>

          <div className="border-t border-gray-100 pt-4 mt-auto">
            <button
              onClick={onLogout}
              className="flex items-center w-full py-3 px-4 text-gray-600 hover:text-red-500 hover:bg-red-50 transition-all duration-150 ease-out text-sm rounded-lg"
            >
              <span className="mr-3 text-gray-400">
                <Power size={19} />
              </span>
              <p className="font-normal text-sm">Logout</p>
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
