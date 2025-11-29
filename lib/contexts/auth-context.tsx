"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { UserRole, UserStatus } from "@prisma/client";

/**
 * User interface representing the authenticated user's data
 */
interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  role: UserRole;
  status: UserStatus;
  walletBalance: number;
  adminWallet: number;
  referralCode: string | null;
  referredBy: string | null;
  hostFeePercentage: number | null;
  createdAt: Date;
}

/**
 * AuthContext interface defining the shape of authentication state and methods
 */
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
  logoutUser: () => Promise<void>;
}

/**
 * Context for global authentication state management
 * This ensures all components share the same authentication state
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider component that wraps the app and provides authentication state
 *
 * Why this fixes the login issue:
 * - Previously, each component using useLoggedInUser() had its own isolated state
 * - After login, components didn't know the auth state changed
 * - Now, all components share the same auth state via Context
 * - When refreshUser() is called after login, ALL components re-render with new user data
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  /**
   * Clears authentication state (used on logout or auth errors)
   */
  const clearAuth = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  /**
   * Fetches current user data from the API
   * This is called on mount and can be triggered manually via refreshUser()
   */
  const fetchUser = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
      });

      if (response.status === 401) {
        // User not authenticated - this is expected for public pages
        clearAuth();
        return;
      }

      if (!response.ok) {
        // For other errors (500, 404, etc.), don't retry automatically
        console.error(`Auth API error: ${response.status}`);
        clearAuth();
        return;
      }

      const data = await response.json();

      if (!data.user) {
        console.error("No user data in response:", data);
        clearAuth();
        return;
      }

      setUser(data.user);
      setIsAuthenticated(true);
    } catch (error) {
      // Network errors or other fetch errors
      console.error("Fetch user error:", error);
      clearAuth();
    } finally {
      setIsLoading(false);
    }
  }, [clearAuth]);

  /**
   * Manually refresh user data
   * This should be called after login/signup to update the global auth state
   */
  const refreshUser = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    await fetchUser();
  }, [fetchUser]);

  /**
   * Logout user and redirect to login page
   */
  const logoutUser = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      clearAuth();
      router.push("/login");
    } catch (error) {
      console.error("Error during logout:", error);
      clearAuth();
      router.push("/login");
    }
  }, [clearAuth, router]);

  /**
   * Fetch user data on mount
   */
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    refreshUser,
    logoutUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook to access authentication context
 * Throws error if used outside AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
