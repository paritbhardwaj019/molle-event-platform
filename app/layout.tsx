import type React from "react";
import type { Metadata } from "next";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { HeaderWrapperClient } from "@/components/header-wrapper-client";
import { OverlaySuppressor } from "@/lib/components/overlay-supress";

const dmSans = DM_Sans({ subsets: ["latin"] });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "Molle - Event Management Platform",
  description: "Discover, host, and manage amazing events with Molle",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${dmSans.className}`}>
        <HeaderWrapperClient />
        {children}
        <Toaster richColors closeButton position="bottom-right" />
      </body>
    </html>
  );
}
