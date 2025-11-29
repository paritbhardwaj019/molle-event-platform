"use client";

import { Header } from "@/components/header";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

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
    "/dashboard/payments",
    "/dashboard/admin/kyc-requests",
    "/dashboard/kyc-verification",
    "/book/*",
    "/dashboard/scan-ticket",
    "/dashboard/exclusive-perks",
    "/dashboard/reviews",
    "/dashboard/admin/reported-hosts",
    "/dashboard/public-profile",
    "/dashboard/followers",
    "/dashboard/admin/event-rules",
    "/dashboard/invite-forms",
    "/dashboard/admin/faqs",
    "/dashboard/admin/amenities",
    "/chat",
    "/dashboard/social/discover",
    "/dashboard/social/matches",
    "/dashboard/social/chat",
    "/dashboard/admin/packages",
    "/dashboard/social/events/*",
    "/dashboard/admin/dating-kyc",
    "/dashboard/admin/reviews",
    "/dashboard/admin/push-notifications",
    "/dashboard/admin/impersonate",
  ];

  if (
    pathnames.includes(pathname) ||
    (pathname.startsWith("/book") && pathname !== "/bookings") ||
    pathname.startsWith("/dashboard/social/")
  ) {
    return null;
  }

  return (
    <Suspense
      fallback={
        <div className="h-20 bg-gradient-to-r from-[#b81ce3] via-[#cc18d9] to-[#e316cd]" />
      }
    >
      <Header />
    </Suspense>
  );
}
