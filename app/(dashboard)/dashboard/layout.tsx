"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Sidebar from "@/components/ui/sidebar";
import { Header } from "@/components/layout/header";
import { AuthRoute } from "@/lib/components/auth/auth-wrapper";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isMessagesPage = pathname === "/dashboard/messages";
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Hide sidebar on messages page for mobile only
  const shouldHideSidebar = isMessagesPage && isMobile;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar removed - navigation now in header menu */}
      <div className="flex flex-col flex-1 overflow-hidden w-full">
        <Header />
        <main
          className={`flex-1 ${isMessagesPage ? "overflow-hidden" : "overflow-y-auto"}`}
        >
          <div className={isMessagesPage ? "" : "p-2 lg:p-4"}>{children}</div>
        </main>
      </div>
    </div>
  );
}
