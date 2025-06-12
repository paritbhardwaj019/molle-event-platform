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
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-col w-full ">
        <Header />
        <main className="w-full">
          <div className="p-2">{children}</div>
        </main>
      </div>
    </div>
  );
}
