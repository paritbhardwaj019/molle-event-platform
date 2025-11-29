"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useLoggedInUser } from "@/lib/hooks/use-logged-in-user";
import { useMessaging } from "@/lib/hooks/use-messaging";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  Users,
  UserPlus,
  Wallet,
  Mail,
  UserCircle,
  HandCoins,
  ArrowLeftRight,
  Link as LinkIcon,
  LineChart,
  UserCog,
  BarChart,
  Settings,
  MapPin,
  Shield,
  QrCode,
  Ticket,
  Star,
  HelpCircle,
  Zap,
  Heart,
  Search,
  MessageCircle as MessageCircleIcon,
  Home,
} from "lucide-react";

export const BOTTOM_NAV_HEIGHT = 72;

const baseRoutes = {
  HOST: [
    { name: "Events", href: "/dashboard/events", icon: Calendar },
    { name: "Bookings", href: "/dashboard/bookings", icon: BookOpen },
    { name: "Home", href: "/", icon: Home, isCenter: true },
    { name: "Messages", href: "/dashboard/messages", icon: Mail },
    { name: "Profile", href: "/profile", icon: UserCircle },
  ],
  USER: [
    { name: "Discover", href: "/dashboard/social/discover", icon: Search },
    { name: "Events", href: "/events", icon: Calendar },
    { name: "Home", href: "/", icon: Home, isCenter: true },
    { name: "Chat", href: "/chat", icon: MessageCircleIcon },
    { name: "Profile", href: "/profile", icon: UserCircle },
  ],
  ADMIN: [
    { name: "Events", href: "/dashboard/admin/events", icon: Calendar },
    { name: "Users", href: "/dashboard/admin/customers", icon: Users },
    { name: "Home", href: "/", icon: Home, isCenter: true },
    { name: "Analytics", href: "/dashboard/admin/analytics", icon: BarChart },
    { name: "Settings", href: "/dashboard/admin/settings", icon: Settings },
  ],
};

const getBottomNavRoutes = (role: keyof typeof baseRoutes) => {
  return baseRoutes[role] || baseRoutes.USER;
};

interface BottomNavItemProps {
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  isActive: boolean;
  badge?: number;
  isCenter?: boolean;
}

function BottomNavItem({
  href,
  icon: Icon,
  label,
  isActive,
  badge,
  isCenter = false,
}: BottomNavItemProps) {
  if (isCenter) {
    return (
      <Link
        href={href}
        className="flex flex-col items-center justify-center flex-1 transition-all duration-200 ease-in-out"
      >
        <div
          className={`relative p-3 rounded-full transition-all duration-200 ${
            isActive
              ? "bg-purple-600 shadow-lg scale-110"
              : "bg-purple-100 hover:bg-purple-200"
          }`}
        >
          <Icon
            size={24}
            className={`${isActive ? "text-white" : "text-purple-600"} transition-colors duration-200`}
          />
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center py-2 px-1 min-w-0 flex-1 transition-all duration-200 ease-in-out ${
        isActive ? "text-purple-600" : "text-gray-500 hover:text-purple-500"
      }`}
    >
      <div className="relative">
        <Icon
          size={20}
          className={`${isActive ? "text-purple-600" : "text-gray-500"} transition-colors duration-200`}
        />
        {badge && Number(badge) > 0 && (
          <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center h-3 w-3 text-[6px] font-bold text-white bg-red-500 rounded-full min-w-[12px] z-10">
            {Number(badge) > 9 ? "9+" : badge}
          </span>
        )}
      </div>
      <span
        className={`text-[10px] mt-1 font-medium max-w-full ${
          isActive ? "text-purple-600" : "text-gray-500"
        } transition-colors duration-200 leading-tight`}
      >
        {label}
      </span>
    </Link>
  );
}

export function MobileBottomNavigation() {
  const pathname = usePathname();
  const { user } = useLoggedInUser();
  const { unreadCount } = useMessaging();
  const isMobile = useIsMobile();

  if (!isMobile || !user) {
    return null;
  }

  const hideNavPages = [
    "/login",
    "/signup",
    "/affiliate",
    "/list-show",
    "/offline",
    "/payment-success",
    "/payment-failed",
  ];

  if (hideNavPages.some((page) => pathname.startsWith(page))) {
    return null;
  }

  const navigation = getBottomNavRoutes(user.role as keyof typeof baseRoutes);

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 lg:hidden">
        <div className="flex items-center justify-around h-18 px-2 py-1">
          {navigation.map((item) => {
            let isActive = false;
            if (item.href === "/") {
              isActive = pathname === "/";
            } else if (item.name === "Chat") {
              isActive =
                pathname === "/chat" ||
                pathname.startsWith("/dashboard/social/chat");
            } else {
              isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));
            }

            const badge =
              item.name === "Messages" || item.name === "Chat"
                ? Number(unreadCount) > 0
                  ? Number(unreadCount)
                  : undefined
                : undefined;

            return (
              <BottomNavItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.name}
                isActive={isActive}
                badge={badge}
                isCenter={(item as any).isCenter}
              />
            );
          })}
        </div>
      </div>
    </>
  );
}
