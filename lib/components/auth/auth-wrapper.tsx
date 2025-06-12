"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useLoggedInUser } from "@/lib/hooks/use-logged-in-user";

interface AuthWrapperProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectIfAuthenticated?: boolean;
  fallback?: React.ReactNode;
}

const DefaultFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
    <div className="relative">
      <div className="w-12 h-12 rounded-full border-2 border-orange-100"></div>
      <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-2 border-transparent border-t-orange-500 animate-spin"></div>
      <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-orange-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
    </div>
  </div>
);

export function AuthWrapper({
  children,
  requireAuth = false,
  redirectIfAuthenticated = false,
  fallback = <DefaultFallback />,
}: AuthWrapperProps) {
  const { isAuthenticated, isLoading } = useLoggedInUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    const redirectUrl = searchParams.get("redirect");

    if (requireAuth && !isAuthenticated) {
      const currentUrl = encodeURIComponent(
        pathname +
          (searchParams.toString() ? `?${searchParams.toString()}` : "")
      );
      router.push(`/login?redirect=${currentUrl}`);
    } else if (redirectIfAuthenticated && isAuthenticated) {
      if (redirectUrl) {
        router.push(decodeURIComponent(redirectUrl));
      } else {
        router.push("/dashboard");
      }
    }
  }, [
    isAuthenticated,
    isLoading,
    requireAuth,
    redirectIfAuthenticated,
    router,
    searchParams,
    pathname,
  ]);

  if (isLoading) {
    return <>{fallback}</>;
  }

  if (requireAuth && !isAuthenticated) {
    return <>{fallback}</>;
  }

  if (redirectIfAuthenticated && isAuthenticated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export function ProtectedRoute({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <AuthWrapper requireAuth={true} fallback={fallback}>
      {children}
    </AuthWrapper>
  );
}

export function PublicRoute({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <AuthWrapper requireAuth={false} fallback={fallback}>
      {children}
    </AuthWrapper>
  );
}

export function AuthRoute({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <AuthWrapper redirectIfAuthenticated={true} fallback={fallback}>
      {children}
    </AuthWrapper>
  );
}
