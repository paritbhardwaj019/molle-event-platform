"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FormError } from "@/components/ui/form-error";
import {
  GoogleSignInButton,
  CustomGoogleSignInButton,
} from "@/components/ui/google-signin-button";
import { loginSchema, type LoginFormData } from "@/lib/validations/auth";
import { login, googleSignIn } from "@/lib/actions/auth";
import { useLoggedInUser } from "@/lib/hooks/use-logged-in-user";
import ForgotPasswordForm from "./forgot-password-form";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [serverError, setServerError] = useState<string>();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { refreshUser } = useLoggedInUser();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const result = await login(data);
      if (result.error) {
        setServerError(result.error);
      } else {
        // Refresh auth state immediately so header and nav update without page refresh
        await refreshUser();
        router.push("/dashboard");
      }
    } catch (error) {
      setServerError("Something went wrong. Please try again.");
    }
  };

  const handleGoogleSignIn = async (credential: string) => {
    try {
      setIsGoogleLoading(true);
      setServerError(undefined);

      const result = await googleSignIn(credential);
      if (result.error) {
        setServerError(result.error);
      } else {
        // Refresh auth state immediately so header and nav update without page refresh
        await refreshUser();
        router.push("/dashboard");
      }
    } catch (error) {
      setServerError("Something went wrong with Google sign-in.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleError = (error: any) => {
    console.error("Google Sign-In Error:", error);
    setServerError("Failed to sign in with Google. Please try again.");
    setIsGoogleLoading(false);
  };

  const handleForgotPasswordSuccess = () => {
    setShowForgotPassword(false);
    setShowEmailLogin(true);
    setServerError(undefined);
  };

  // Show forgot password form
  if (showForgotPassword) {
    return (
      <ForgotPasswordForm
        onBack={() => {
          setShowForgotPassword(false);
          setShowEmailLogin(true);
        }}
        onSuccess={handleForgotPasswordSuccess}
      />
    );
  }

  const redirectTarget =
    searchParams.get("redirectTo") || searchParams.get("redirect");

  return (
    <div className="w-full max-w-md space-y-6 bg-white p-8 rounded-lg shadow-lg">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Sign in to Molle</h2>
        <p className="text-gray-600 mt-2">
          Welcome back! Please enter your details
        </p>
      </div>

      {serverError && (
        <div className="p-3 rounded-md bg-red-500/10 border border-red-500/50 text-red-500">
          {serverError}
        </div>
      )}

      {showEmailLogin ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              {...register("email")}
            />
            <FormError message={errors.email?.message} />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              {...register("password")}
            />
            <FormError message={errors.password?.message} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox id="remember" {...register("rememberMe")} />
              <label
                htmlFor="remember"
                className="text-sm font-medium leading-none"
              >
                Remember me
              </label>
            </div>
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-sm text-primary hover:underline"
            >
              Forgot password?
            </button>
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setShowEmailLogin(false)}
          >
            ← Back to all options
          </Button>
        </form>
      ) : (
        <div className="space-y-4">
          {/* Google Sign-In Button */}
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

          {/* Fallback Custom Button */}
          <CustomGoogleSignInButton
            onClick={() => {
              // This will trigger the Google One Tap if the official button fails
              if (window.google && window.google.accounts) {
                window.google.accounts.id.prompt();
              }
            }}
            disabled={isGoogleLoading}
            className="text-sm"
          >
            {isGoogleLoading ? "Signing in..." : "Continue with Google"}
          </CustomGoogleSignInButton>

          <div className="relative">
            <div className="absolute inset-0 flex items_center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowEmailLogin(true)}
          >
            📧 Sign in with Email
          </Button>
        </div>
      )}

      <p className="text-center text-sm text-gray-600">
        Don't have an account?{" "}
        <Link
          href={
            redirectTarget
              ? `/signup?redirectTo=${encodeURIComponent(redirectTarget)}`
              : "/signup"
          }
          className="text-primary hover:underline"
        >
          Sign up for free
        </Link>
      </p>
    </div>
  );
}
