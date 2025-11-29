"use client";

import { AuthProvider } from "@/lib/contexts/auth-context";
import { ReactNode } from "react";

/**
 * Client-side wrapper for AuthProvider
 * This allows us to use it in the server-side root layout
 */
export function AuthProviderWrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
