"use client";

import type React from "react";

import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "./sidebar";
import { Separator } from "@/components/ui/separator";

interface SidebarWrapperProps {
  children: React.ReactNode;
}

export function SidebarWrapper({ children }: SidebarWrapperProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-gradient-to-r from-white to-gray-50/50 px-4">
          <SidebarTrigger className="text-gray-600 hover:text-violet-600 hover:bg-violet-50 transition-colors" />
          <Separator orientation="vertical" className="mr-2 h-4 bg-gray-200" />
        </header>
        <main className="flex-1 overflow-auto bg-gray-50/30">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
