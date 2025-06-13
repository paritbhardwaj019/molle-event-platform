"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useLoggedInUser } from "@/lib/hooks/use-logged-in-user";
import { useMessaging } from "@/lib/hooks/use-messaging";
import { Power } from "lucide-react";
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
} from "lucide-react";

export default function Sidebar() {
  const { user, logoutUser } = useLoggedInUser();
  const { unreadCount } = useMessaging();
  const router = useRouter();

  const handleLogout = () => {
    logoutUser();
    router.push("/");
  };

  if (!user) return null;

  const navigation = getSidebarRoutes(user.role as keyof typeof baseRoutes);

  return (
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

      <div className="border-t border-gray-100 p-4">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-2 py-3 text-gray-600 hover:text-red-500 hover:bg-red-50 transition-all duration-150 ease-out rounded-md"
        >
          <span className="mr-3">
            <Power size={19} />
          </span>
          <p className="font-normal">Logout</p>
        </button>
      </div>
    </div>
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
          <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
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
    { name: "Referrers", href: "/dashboard/referrers", icon: UserPlus },
    {
      name: "Referrer Codes",
      href: "/dashboard/referrer-codes",
      icon: HandCoins,
    },
    { name: "Messages", href: "/dashboard/messages", icon: Mail },
    { name: "Invites", href: "/dashboard/invites", icon: Mail },
    { name: "Payments", href: "/dashboard/payments", icon: Wallet },
    { name: "Referrals", href: "/dashboard/referrals", icon: HandCoins },
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
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
    { name: "Links", href: "/dashboard/links", icon: LinkIcon },
  ],
};

const getSidebarRoutes = (role: keyof typeof baseRoutes) => {
  return baseRoutes[role] || [];
};
