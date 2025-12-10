"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { usePWA } from "@/hooks/use-pwa";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLoggedInUser } from "@/lib/hooks/use-logged-in-user";
import { loginSchema, type LoginFormData } from "@/lib/validations/auth";
import { login, googleSignIn } from "@/lib/actions/auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { GoogleSignInButton } from "@/components/ui/google-signin-button";
import { toast } from "sonner";

const STORAGE_KEY = "molle-mobile-login-complete";

/**
 * Mobile/PWA login gate
 *
 * - Shows a non-dismissible full-screen login overlay on first visit
 *   for mobile or PWA users
 * - Cannot be closed via outside click or ESC
 * - Closes automatically only after successful login
 * - Does NOT affect normal /login or other auth pages
 */
export function MobileLoginGate() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isPWA, isClient } = usePWA();
  const isMobile = useIsMobile();
  const {
    isAuthenticated,
    isLoading: authLoading,
    refreshUser,
  } = useLoggedInUser();

  const [shouldShow, setShouldShow] = useState(false);
  const [initialised, setInitialised] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  // Decide when to show gate
  useEffect(() => {
    if (!isClient) return;

    const isAuthRoute = ["/login", "/signup", "/affiliate", "/list-show"].some(
      (p) => pathname?.startsWith(p)
    );

    // Never gate on dedicated auth pages
    if (isAuthRoute) {
      setShouldShow(false);
      setInitialised(true);
      return;
    }

    // If already authenticated, never show
    if (isAuthenticated) {
      setShouldShow(false);
      setInitialised(true);
      return;
    }

    // Only gate for mobile or installed PWA
    const isMobileOrPWA = isMobile || isPWA;
    if (!isMobileOrPWA) {
      setShouldShow(false);
      setInitialised(true);
      return;
    }

    // First-visit check via localStorage
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const hasCompletedLogin = stored === "true";

    setShouldShow(!hasCompletedLogin);
    setInitialised(true);
  }, [isClient, isPWA, isMobile, isAuthenticated, pathname]);

  // Helper: build current URL for redirectTo
  const buildCurrentUrl = () => {
    const qs = searchParams.toString();
    return pathname + (qs ? `?${qs}` : "");
  };

  // Submit handler for email/password login
  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsSubmitting(true);
      const result = await login(data);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.success) {
        toast.success("Successfully logged in!");

        // Refresh global auth state
        await refreshUser();

        // Mark as completed so gate never shows again
        if (typeof window !== "undefined") {
          window.localStorage.setItem(STORAGE_KEY, "true");
        }

        setShouldShow(false);
      }
    } catch (error) {
      toast.error("Failed to login. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Google sign-in handler
  const handleGoogleSignIn = async (credential: string) => {
    try {
      setIsGoogleLoading(true);
      const result = await googleSignIn(credential);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Successfully signed in with Google!");

        await refreshUser();

        if (typeof window !== "undefined") {
          window.localStorage.setItem(STORAGE_KEY, "true");
        }

        setShouldShow(false);
      }
    } catch (error) {
      toast.error("Failed to sign in with Google. Please try again.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleError = (error: any) => {
    console.error("Google Sign-In Error:", error);
    toast.error("Failed to sign in with Google. Please try again.");
    setIsGoogleLoading(false);
  };

  // While deciding, render nothing to avoid flash
  if (!initialised || !shouldShow) {
    return null;
  }

  // Non-dismissible full-screen overlay
  return (
    <div className="fixed inset-0 z-[60] bg-[#121212] text-white flex items-center justify-center">
      <div className="w-full h-full max-w-none mx-0 flex flex-col items-center justify-center px-6 py-8">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold mb-2 sm:text-3xl">
            Welcome to Molle Events
          </h2>
          <p className="text-sm text-white/70 max-w-sm mx-auto">
            Please sign in to continue using Molle and discover the best events
            around you.
          </p>
        </div>

        <div className="space-y-4 w-full max-w-md">
          {/* Google Sign-In Section */}
          <div className="flex justify-center">
            <GoogleSignInButton
              onSuccess={handleGoogleSignIn}
              onError={handleGoogleError}
              text="signin_with"
              theme="outline"
              size="large"
              width={320}
            />
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#121212] px-2 text-white/70">
                Or sign in with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-white">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                className="bg-muted border-white/20 text-white"
                disabled={isSubmitting || authLoading}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-red-400 mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="password" className="text-white">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                className="bg-muted border-white/20 text-white"
                disabled={isSubmitting || authLoading}
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-red-400 mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  disabled={isSubmitting || authLoading}
                  {...register("rememberMe")}
                  className="border-white/20 data-[state=checked]:bg-violet-500 data-[state=checked]:border-violet-500"
                />
                <label
                  htmlFor="remember"
                  className="text-xs font-medium leading-none text-white"
                >
                  Remember me
                </label>
              </div>
              <button
                type="button"
                onClick={() => {
                  const currentUrl = buildCurrentUrl();
                  router.push(
                    `/login?forgotPassword=true&redirectTo=${encodeURIComponent(
                      currentUrl
                    )}`
                  );
                }}
                className="text-xs text-primary hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary text-white hover:bg-primary/90"
              disabled={isSubmitting || authLoading}
            >
              {isSubmitting || authLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <p className="text-center text-xs text-white/70 pt-1">
            Don't have an account?{" "}
            <Link
              href={`/signup?redirectTo=${encodeURIComponent(buildCurrentUrl())}`}
              className="text-primary hover:underline font-medium"
            >
              Sign up for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}



