"use client";

import { usePWA } from "@/hooks/use-pwa";
import { cn } from "@/lib/utils";

interface PWAContentWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function PWAContentWrapper({
  children,
  className,
}: PWAContentWrapperProps) {
  const { isPWA, isClient } = usePWA();

  return (
    <div
      className={cn(
        className,
        isClient && isPWA && "pb-20" // Add bottom padding for bottom navigation
      )}
    >
      {children}
    </div>
  );
}
