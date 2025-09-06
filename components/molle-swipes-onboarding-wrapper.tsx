"use client";

import { useState, useEffect } from "react";
import { MolleSwipesOnboarding } from "./molle-swipes-onboarding";

const ONBOARDING_KEY = "molle-swipes-onboarding-shown";

export function MolleSwipesOnboardingWrapper() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
    // Mark onboarding as shown
    localStorage.setItem(ONBOARDING_KEY, "true");
  };

  // Expose the show function globally so header can access it
  useEffect(() => {
    if (isClient) {
      window.showMolleSwipesOnboarding = () => {
        setShowOnboarding(true);
      };

      // Cleanup function to remove the global function
      return () => {
        delete window.showMolleSwipesOnboarding;
      };
    }
  }, [isClient]);

  // Don't render anything on server-side
  if (!isClient) {
    return null;
  }

  return (
    <MolleSwipesOnboarding
      isOpen={showOnboarding}
      onClose={handleCloseOnboarding}
    />
  );
}
