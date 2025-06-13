"use client";

import Sidebar from "@/components/ui/sidebar";
import { Header } from "@/components/layout/header";
import { AuthRoute } from "@/lib/components/auth/auth-wrapper";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="p-2">{children}</div>
        </main>
      </div>
    </div>
  );
}
