import type React from "react";
import type { Metadata } from "next";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { PWANavigationWrapper } from "@/components/pwa-navigation-wrapper";
import { MolleSwipesOnboardingWrapper } from "@/components/molle-swipes-onboarding-wrapper";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { PWARegistration } from "@/components/pwa-registration";
import { MobileContentWrapper } from "@/components/mobile-content-wrapper";
import { PushNotificationProvider } from "@/components/push-notification-provider";

const dmSans = DM_Sans({ subsets: ["latin"] });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "Molle - Event Management Platform",
  description:
    "Discover, host, and manage amazing events with Molle. Connect with people, build communities, and create unforgettable experiences.",
  manifest: "/manifest.json",
  themeColor: "#8b5cf6",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Molle",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://molle.com",
    title: "Molle - Event Management Platform",
    description: "Discover, host, and manage amazing events with Molle",
    siteName: "Molle",
    images: [
      {
        url: "/images/hero-event-1.png",
        width: 1200,
        height: 630,
        alt: "Molle Event Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Molle - Event Management Platform",
    description: "Discover, host, and manage amazing events with Molle",
    images: ["/images/hero-event-1.png"],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="application-name" content="Molle" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Molle" />
        <meta
          name="description"
          content="Discover, host, and manage amazing events with Molle"
        />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/icons/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#8b5cf6" />
        <meta name="msapplication-tap-highlight" content="no" />

        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/icons/icon-96x96.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/icons/icon-96x96.png"
        />
        <link rel="manifest" href="/manifest.json" />
        <link rel="mask-icon" href="/icons/icon-192x192.png" color="#8b5cf6" />
        <link rel="shortcut icon" href="/icons/icon-96x96.png" />

        <meta name="twitter:card" content="summary" />
        <meta name="twitter:url" content="https://molle.com" />
        <meta
          name="twitter:title"
          content="Molle - Event Management Platform"
        />
        <meta
          name="twitter:description"
          content="Discover, host, and manage amazing events with Molle"
        />
        <meta name="twitter:image" content="/images/hero-event-1.png" />
        <meta name="twitter:creator" content="@molle" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Molle - Event Management Platform" />
        <meta
          property="og:description"
          content="Discover, host, and manage amazing events with Molle"
        />
        <meta property="og:site_name" content="Molle" />
        <meta property="og:url" content="https://molle.com" />
        <meta property="og:image" content="/images/hero-event-1.png" />
      </head>
      <body className={`${spaceGrotesk.variable} ${dmSans.className}`}>
        <PWARegistration />
        <PWANavigationWrapper />
        <MobileContentWrapper>{children}</MobileContentWrapper>
        <MolleSwipesOnboardingWrapper />
        <PWAInstallPrompt />
        <PushNotificationProvider />
        <Toaster richColors closeButton position="bottom-right" />
      </body>
    </html>
  );
}
