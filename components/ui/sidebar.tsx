"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useLoggedInUser } from "@/lib/hooks/use-logged-in-user";
import { useMessaging } from "@/lib/hooks/use-messaging";
import { Power, Menu, X } from "lucide-react";
import { useState } from "react";
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
  MessageCircle,
  Bell,
} from "lucide-react";

import { Button } from "@/components/ui/button";

// Mobile Sidebar Component - Removed as it's now in header
function MobileSidebar() {
  return null;
}

export default function Sidebar() {
  const { user, logoutUser } = useLoggedInUser();
  const { unreadCount } = useMessaging();
  const router = useRouter();

  const handleLogout = () => {
    logoutUser();
    router.push("/");
  };

  if (!user) return <MobileSidebar />;

  const navigation = getSidebarRoutes(user.role as keyof typeof baseRoutes);

  return (
    <>
      {/* Mobile Sidebar */}
      <MobileSidebar />

      {/* Desktop Sidebar */}
      <div className="flex flex-col bg-white border-r border-gray-100 text-gray-900 min-w-[264px] w-[264px] h-full hidden lg:flex">
        <div className="flex-1 overflow-y-auto">
          <ul className="w-full space-y-2 mt-4 pb-20">
            {navigation.map((item) => (
              <SidebarItem
                text={item.name}
                to={item.href}
                icon={<item.icon size={20} />}
                badge={
                  item.name === "Messages" ? unreadCount : (item as any).badge
                }
                key={item.href}
              />
            ))}
          </ul>
        </div>

        <div className="border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center w-full py-4 px-6 text-gray-600 hover:text-red-500 hover:bg-red-50 transition-all duration-150 ease-out text-sm "
          >
            <span className="mr-3 text-gray-400 group-hover:text-purple-600">
              <Power size={19} />
            </span>
            <p className="font-normal text-sm">Logout</p>
          </button>
        </div>
      </div>
    </>
  );
}

function SidebarItem({
  to,
  icon,
  text,
  badge,
}: {
  to: string;
  icon: React.ReactNode;
  text: string;
  badge?: number;
}) {
  const pathname = usePathname();
  const isActive = pathname === to;

  return (
    <li className="flex items-center w-full">
      <Link
        href={to}
        className={`flex items-center w-full font-normal transition-all duration-150 ease-out px-6 py-3 ${
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
      icon: MessageCircle,
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
    { name: "Reviews", href: "/dashboard/admin/reviews", icon: Star },
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
  ],
};

const getSidebarRoutes = (role: keyof typeof baseRoutes) => {
  return baseRoutes[role] || [];
};
