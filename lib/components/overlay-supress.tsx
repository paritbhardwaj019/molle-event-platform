"use client";

import { useEffect } from "react";

export function OverlaySuppressor({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      const suppressErrors = (e: Event) => e.stopImmediatePropagation();

      window.addEventListener("error", suppressErrors, true);
      window.addEventListener("unhandledrejection", suppressErrors, true);

      const interval = setInterval(() => {
        const overlay = document.querySelector("[data-nextjs-error-overlay]");
        if (overlay) (overlay as HTMLElement).style.display = "none";
      }, 300);

      return () => {
        clearInterval(interval);
        window.removeEventListener("error", suppressErrors, true);
        window.removeEventListener("unhandledrejection", suppressErrors, true);
      };
    }
  }, []);

  return <>{children}</>;
}
