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
  const [retryCount, setRetryCount] = useState(0);
  const router = useRouter();

  const clearAuth = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const fetchUser = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch("/api/auth/me");

      if (response.status === 401) {
        console.log("User not authenticated");
        clearAuth();
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.user) {
        console.error("No user data in response:", data);
        clearAuth();
        return;
      }

      setUser(data.user);
      setIsAuthenticated(true);
      setRetryCount(0); // Reset retry count on successful fetch
    } catch (error) {
      console.error("Fetch user error:", error);

      // Retry logic for network errors
      if (retryCount < 3) {
        console.log(`Retrying fetch... Attempt ${retryCount + 1}`);
        setRetryCount((prev) => prev + 1);
        setTimeout(() => fetchUser(), 1000 * (retryCount + 1)); // Exponential backoff
      } else {
        clearAuth();
      }
    } finally {
      setIsLoading(false);
    }
  }, [clearAuth, retryCount]);

  const refreshUser = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setRetryCount(0); // Reset retry count on manual refresh
    await fetchUser();
  }, [fetchUser]);

  const logoutUser = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
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
  }, [fetchUser]);

  return {
    user,
    isLoading,
    isAuthenticated,
    refreshUser,
    logoutUser,
  };
}
