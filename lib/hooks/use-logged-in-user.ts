"use client";

/**
 * useLoggedInUser hook - now uses global AuthContext
 *
 * This hook previously created isolated state for each component.
 * Now it accesses the shared authentication state from AuthContext,
 * ensuring all components stay in sync when auth state changes.
 */
import { useAuth } from "@/lib/contexts/auth-context";

export function useLoggedInUser() {
  return useAuth();
}
