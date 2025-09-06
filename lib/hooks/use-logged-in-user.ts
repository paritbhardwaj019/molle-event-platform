"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { UserRole, UserStatus } from "@prisma/client";

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
  createdAt: Date;
}

interface UseLoggedInUserReturn {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
  logoutUser: () => Promise<void>;
}

export function useLoggedInUser(): UseLoggedInUserReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  const clearAuth = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
  }, []);

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

  const refreshUser = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    await fetchUser();
  }, [fetchUser]);

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

  useEffect(() => {
    fetchUser();
  }, []); // Only run once on mount

  return {
    user,
    isLoading,
    isAuthenticated,
    refreshUser,
    logoutUser,
  };
}
