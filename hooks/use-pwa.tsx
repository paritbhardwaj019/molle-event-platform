import { useState, useEffect } from "react";

export function usePWA() {
  const [isPWA, setIsPWA] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    const checkPWA = () => {
      const isStandalone = window.matchMedia(
        "(display-mode: standalone)"
      ).matches;
      setIsPWA(isStandalone);
    };

    checkPWA();

    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handleChange = () => {
      checkPWA();
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return { isPWA, isClient };
}
