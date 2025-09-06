"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { useLoggedInUser } from "@/lib/hooks/use-logged-in-user";
import { usePathname } from "next/navigation";
import { BOTTOM_NAV_HEIGHT } from "./mobile-bottom-navigation";

interface MobileContentWrapperProps {
  children: React.ReactNode;
}

export function MobileContentWrapper({ children }: MobileContentWrapperProps) {
  const isMobile = useIsMobile();
  const { user } = useLoggedInUser();
  const pathname = usePathname();

  // Don't add padding on desktop or if no user
  if (!isMobile || !user) {
    return <>{children}</>;
  }

  // Don't add padding on auth pages or pages that shouldn't have navigation
  const hideNavPages = [
    "/login",
    "/signup",
    "/affiliate",
    "/list-show",
    "/offline",
    "/payment-success",
    "/payment-failed",
  ];

  const shouldAddPadding = !hideNavPages.some((page) =>
    pathname.startsWith(page)
  );

  return (
    <div
      className={shouldAddPadding ? "pb-18" : ""}
      style={
        shouldAddPadding ? { paddingBottom: `${BOTTOM_NAV_HEIGHT}px` } : {}
      }
    >
      {children}
    </div>
  );
}
