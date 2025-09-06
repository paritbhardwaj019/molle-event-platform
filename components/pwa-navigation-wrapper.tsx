"use client";

import { HeaderWrapperClient } from "@/components/header-wrapper-client";
import { MobileBottomNavigation } from "@/components/mobile-bottom-navigation";

export function PWANavigationWrapper() {
  return (
    <>
      <HeaderWrapperClient />
      <MobileBottomNavigation />
    </>
  );
}
