"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { FormError } from "@/components/ui/form-error";
import { PasswordStrength } from "@/components/ui/password-strength";
import { signupSchema, type SignupFormData } from "@/lib/validations/auth";
import { signup, googleSignIn } from "@/lib/actions/auth";

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string>();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      role: "USER",
      agreedToTerms: true,
    },
  });

  const password = watch("password");

  const onSubmit = async (data: SignupFormData) => {
    try {
      const result = await signup(data);
      if (result.error) {
        setServerError(result.error);
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      setServerError("Something went wrong. Please try again.");
    }
  };

  const handleGoogleSignIn = async (response: any) => {
    try {
      const result = await googleSignIn(response.credential);
      if (result.error) {
        setServerError(result.error);
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      setServerError("Something went wrong with Google sign-in.");
    }
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
              Join Us and Unlock Endless Possibilities!
            </h1>
            <p className="text-xl text-white/80">
              Welcome to Molle, where your journey begins. Sign up now to access
              exclusive features, personalized recommendations, and seamless
              user experience.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                  ⭐️
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white/80">
                    "We love Molle! Our event planners were using it for their
                    projects, so we already knew what kind of experience they
                    want."
                  </p>
                  <p className="text-sm font-medium mt-1">
                    Sarah Johnson • Event Director, EventPro
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-primary to-transparent" />
        </div>

        {/* Right Side - Sign Up Form */}
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
                Sign up to Molle
              </h2>
              <p className="text-muted-foreground mt-2">
                Create your account to get started
              </p>
            </div>

            {serverError && (
              <div className="p-3 rounded-md bg-red-500/10 border border-red-500/50 text-red-500">
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="fullName" className="text-white">
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  placeholder="Enter your full name"
                  className="bg-muted border-white/20 text-white"
                  {...register("fullName")}
                />
                <FormError message={errors.fullName?.message} />
              </div>

              <div>
                <Label htmlFor="email" className="text-white">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="bg-muted border-white/20 text-white"
                  {...register("email")}
                />
                <FormError message={errors.email?.message} />
              </div>

              <div>
                <Label htmlFor="password" className="text-white">
                  Create Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  className="bg-muted border-white/20 text-white"
                  {...register("password")}
                />
                {password && <PasswordStrength password={password} />}
                {errors.password && (
                  <FormError message={errors.password.message} />
                )}
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-white">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  className="bg-muted border-white/20 text-white"
                  {...register("confirmPassword")}
                />
                {errors.confirmPassword && (
                  <FormError message={errors.confirmPassword.message} />
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms"
                    {...register("agreedToTerms")}
                    className="border-white/20 data-[state=checked]:bg-violet-500 data-[state=checked]:border-violet-500"
                    aria-invalid={errors.agreedToTerms ? "true" : "false"}
                  />
                  <label
                    htmlFor="terms"
                    className={`text-sm font-medium leading-none ${
                      errors.agreedToTerms ? "text-red-500" : "text-white"
                    }`}
                  >
                    By signing up, you agree to our{" "}
                    <Link
                      href="/terms"
                      className="text-violet-500 hover:text-violet-400 underline underline-offset-4"
                      target="_blank"
                    >
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/privacy"
                      className="text-violet-500 hover:text-violet-400 underline underline-offset-4"
                      target="_blank"
                    >
                      Privacy Policy
                    </Link>
                  </label>
                </div>
                {errors.agreedToTerms && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.agreedToTerms.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-violet-600 text-white hover:bg-violet-700 transition-colors"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Creating account...
                  </div>
                ) : (
                  "Create Account"
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[#121212] px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <div
                id="google-signin"
                className="w-full"
                data-callback="handleGoogleSignIn"
              />

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Log in here
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#121212] flex items-center justify-center">
          <p className="text-white">Loading...</p>
        </div>
      }
    >
      <SignupContent />
    </Suspense>
  );
}
