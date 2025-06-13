"use client";

import { Header } from "@/components/header";
import { usePathname } from "next/navigation";

export function HeaderWrapperClient() {
  const pathname = usePathname();

  const pathnames = [
    "/dashboard",
    "/signup",
    "/login",
    "/dashboard/links",
    "/dashboard/referrers",
    "/dashboard/customers",
    "/dashboard/events",
    "/dashboard/invites",
    "/dashboard/bookings",
    "/dashboard/referrals",
    "/affiliate",
    "/list-show",
    "/dashboard/referrer-codes",
    "/dashboard/hosts",
    "/dashboard/settings",
    "/dashboard/cities",
    "/dashboard/messages",
  ];

  if (pathnames.includes(pathname)) {
    return null;
  }

  return <Header />;
}
