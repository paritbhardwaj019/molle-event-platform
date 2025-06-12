"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { useLoggedInUser } from "@/lib/hooks/use-logged-in-user";
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
} from "lucide-react";
import { useState } from "react";

export type SidebarRoute = {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  badge?: number;
};

const baseRoutes: Record<string, SidebarRoute[]> = {
  HOST: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Events", href: "/dashboard/events", icon: Calendar },
    { name: "Bookings", href: "/dashboard/bookings", icon: BookOpen },
    { name: "Customers", href: "/dashboard/customers", icon: Users },
    { name: "Referrers", href: "/dashboard/referrers", icon: UserPlus },
    { name: "Revenue", href: "/dashboard/revenue", icon: Wallet },
    { name: "Invites", href: "/dashboard/invites", icon: Mail, badge: 2 },
    { name: "Profile", href: "/dashboard/profile", icon: UserCircle },
    { name: "Links", href: "/dashboard/links", icon: LinkIcon },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ],
  REFERRER: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Referrals", href: "/dashboard/referrals", icon: HandCoins },
    { name: "Wallet", href: "/dashboard/wallet", icon: Wallet },
    { name: "Payouts", href: "/dashboard/payouts", icon: ArrowLeftRight },
    { name: "Links", href: "/dashboard/links", icon: LinkIcon },
    { name: "Profile", href: "/dashboard/profile", icon: UserCircle },
  ],
  ADMIN: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Users", href: "/dashboard/users", icon: UserCog },
    { name: "Events", href: "/dashboard/events", icon: Calendar },
    { name: "Bookings", href: "/dashboard/bookings", icon: BookOpen },
    { name: "Referrers", href: "/dashboard/referrers", icon: UserPlus },
    { name: "Payments", href: "/dashboard/payments", icon: Wallet },
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
    { name: "Links", href: "/dashboard/links", icon: LinkIcon },
  ],
};

export const getSidebarRoutes = (
  role: keyof typeof baseRoutes
): SidebarRoute[] => {
  return baseRoutes[role] || [];
};

export const hasRouteAccess = (
  role: keyof typeof baseRoutes,
  routeName: string
) => {
  return getSidebarRoutes(role).some((r: SidebarRoute) => r.name === routeName);
};

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useLoggedInUser();
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return null;

  const navigation = getSidebarRoutes(user.role as keyof typeof baseRoutes);

  return (
    <div
      className={
        collapsed
          ? "hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-20 lg:flex-col"
          : "hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col"
      }
    >
      <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-2 pb-4">
        <div className="flex h-16 shrink-0 items-center justify-between px-4">
          <Logo className="text-black" />
          <button
            className="p-1 rounded hover:bg-gray-100"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <svg width="20" height="20" fill="none" stroke="currentColor">
                <path
                  d="M7 7l5 5-5 5"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg width="20" height="20" fill="none" stroke="currentColor">
                <path
                  d="M13 17l-5-5 5-5"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item: SidebarRoute) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" &&
                      pathname.startsWith(item.href));
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          isActive
                            ? "bg-purple-50 text-purple-600 "
                            : "text-gray-700 hover:text-purple-600 hover:bg-purple-50",
                          "group flex items-center gap-x-3 p-2 text-sm leading-6 font-medium px-6"
                        )}
                        title={collapsed ? item.name : undefined}
                      >
                        <item.icon
                          className={cn(
                            isActive
                              ? "text-purple-600"
                              : "text-gray-400 group-hover:text-purple-600",
                            "h-5 w-5 shrink-0"
                          )}
                          aria-hidden="true"
                        />
                        {!collapsed && (
                          <span className="flex-1 flex items-center justify-between">
                            {item.name}
                            {item.badge && (
                              <span className="ml-2 inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
                                {item.badge}
                              </span>
                            )}
                          </span>
                        )}
                        {collapsed && item.badge && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-purple-100 px-1.5 py-0.5 text-xs font-semibold text-purple-700">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
