"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/logo";
import { Checkbox } from "@/components/ui/checkbox";
import {
  GoogleSignInButton,
  CustomGoogleSignInButton,
} from "@/components/ui/google-signin-button";
import { loginSchema, type LoginFormData } from "@/lib/validations/auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { login, googleSignIn } from "@/lib/actions/auth";

function LoginContent() {
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

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

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      const result = await login(data);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.success) {
        toast.success("Successfully logged in!");
        const redirectUrl =
          searchParams.get("redirectTo") || searchParams.get("redirect");
        if (redirectUrl) {
          router.push(decodeURIComponent(redirectUrl));
        } else {
          // Redirect based on user role
          if (result.user?.role === "USER") {
            router.push("/");
          } else {
            router.push("/dashboard");
          }
        }
        router.refresh();
      }
    } catch (error) {
      toast.error("Failed to login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async (credential: string) => {
    try {
      setIsGoogleLoading(true);

      const result = await googleSignIn(credential);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Successfully signed in with Google!");
        const redirectUrl =
          searchParams.get("redirectTo") || searchParams.get("redirect");
        if (redirectUrl) {
          router.push(decodeURIComponent(redirectUrl));
        } else {
          // Redirect based on user role
          if (result.user?.role === "USER") {
            router.push("/");
          } else {
            router.push("/dashboard");
          }
        }
        router.refresh();
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

  return (
    <div className="min-h-screen bg-[#121212] flex">
      <div className="w-full grid md:grid-cols-2">
        <div className="hidden md:flex flex-col bg-primary p-12 text-white justify-between relative">
          <div>
            <Link
              href="/"
              className="inline-flex items-center text-white hover:text-white/90"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back to Home
            </Link>
          </div>

          <div className="space-y-6">
            <h1 className="text-5xl font-bold leading-tight">
              Welcome to molle, find craziest events here!
            </h1>
            <p className="text-xl text-white/80">
              Sign in to continue your adventure with Molle. Access your events,
              connect with hosts, and discover new experiences.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                  ⭐️
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white/80">
                    "Molle is the best platform to find happening events across
                    town"
                  </p>
                  <p className="text-sm font-medium mt-1">- Ajay Shah</p>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-primary to-transparent" />
        </div>

        <div className="flex items-center justify-center p-8">
          <div className="w-full max-w-md space-y-6">
            <div className="text-center">
              <div className="inline-block md:hidden mb-6">
                <Link
                  href="/"
                  className="inline-flex items-center text-white hover:text-white/90"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-2"
                  >
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                  Back to Home
                </Link>
              </div>
              <h2 className="text-2xl font-bold text-white">
                Sign in to Molle
              </h2>
              <p className="text-muted-foreground mt-2">
                Welcome back! Please enter your details
              </p>
            </div>

            {showEmailLogin ? (
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
                    disabled={isLoading}
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500 mt-1">
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
                    disabled={isLoading}
                    {...register("password")}
                  />
                  {errors.password && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.password.message}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      disabled={isLoading}
                      {...register("rememberMe")}
                      className="border-white/20 data-[state=checked]:bg-violet-500 data-[state=checked]:border-violet-500"
                    />
                    <label
                      htmlFor="remember"
                      className="text-sm font-medium leading-none text-white"
                    >
                      Remember me
                    </label>
                  </div>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-primary text-white hover:bg-primary/90"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign in"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-white hover:bg-violet-500/10 hover:text-violet-500 transition-colors"
                  onClick={() => setShowEmailLogin(false)}
                  disabled={isLoading}
                >
                  ← Back to all options
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                {/* Google Sign-In Section */}
                <div className="flex justify-center">
                  <GoogleSignInButton
                    onSuccess={handleGoogleSignIn}
                    onError={handleGoogleError}
                    text="signin_with"
                    theme="outline"
                    size="large"
                    width={350}
                  />
                </div>

                <Button
                  variant="outline"
                  className="w-full bg-white/5 text-white border-white/10 hover:bg-white/10"
                  disabled={isLoading}
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Sign in with Facebook
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/20" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#121212] px-2 text-white/70">
                      Or continue with
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full bg-white/5 text-white border-white/10 hover:bg-white/10"
                  onClick={() => setShowEmailLogin(true)}
                  disabled={isLoading}
                >
                  📧 Sign in with Email
                </Button>
              </div>
            )}

            <p className="text-center text-sm text-white/70">
              Don't have an account?{" "}
              <Link href="/signup" className="text-primary hover:underline">
                Sign up for free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#121212] flex items-center justify-center">
          <p className="text-white">Loading...</p>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
