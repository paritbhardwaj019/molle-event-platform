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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
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
    setMobileSidebarOpen(false);
  };

  if (!user) return null;

  // Hide header on messages page for mobile only
  if (pathname === "/dashboard/messages" && isMobile) return null;

  const navigation = getSidebarRoutes(user.role as keyof typeof baseRoutes);

  return (
    <>
      <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 sm:gap-x-6 sm:px-6 lg:px-8">
        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
          {/* Mobile Hamburger Menu */}
          <div className="flex lg:hidden mt-2  flex-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileSidebarOpen(true)}
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

            <div className="flex justify-end items-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full hover:bg-purple-50"
                  >
                    <Avatar className="h-8 w-8 ring-2 ring-purple-100">
                      <AvatarImage
                        src={user.avatar || undefined}
                        alt={user.name}
                      />
                      <AvatarFallback className="bg-purple-50 text-purple-600">
                        {user.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56 bg-white border-gray-200 rounded-sm"
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
                  <DropdownMenuSeparator className="bg-gray-200" />

                  {/* Back to Homepage - Only for regular users */}
                  {user.role === "USER" && (
                    <DropdownMenuItem asChild>
                      <Link
                        href="/"
                        className="text-gray-700 hover:text-purple-600 hover:bg-purple-50 cursor-pointer"
                      >
                        <Home className="mr-2 h-4 w-4" />
                        Back to Homepage
                      </Link>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem
                    onClick={() => logoutUser()}
                    className="text-gray-700 hover:text-purple-600 hover:bg-purple-50 cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />

          {/* Sidebar */}
          <div className="fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-xl lg:hidden">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileSidebarOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Navigation */}
              <div className="flex-1 overflow-y-auto p-4">
                <ul className="space-y-2">
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
                      onItemClick={() => setMobileSidebarOpen(false)}
                    />
                  ))}
                </ul>
              </div>

              {/* Footer */}
              <div className="border-t border-gray-100 p-4">
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
          </div>
        </>
      )}
    </>
  );
}
