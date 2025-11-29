"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

import { FormError } from "@/components/ui/form-error";
import { PasswordStrength } from "@/components/ui/password-strength";
import { GoogleSignInButton } from "@/components/ui/google-signin-button";
import { PhoneNumberPopup } from "@/components/ui/phone-number-popup";
import { signupSchema, type SignupFormData } from "@/lib/validations/auth";
import { signup, googleSignUp } from "@/lib/actions/auth";
import { UserRole } from "@prisma/client";
import { useLoggedInUser } from "@/lib/hooks/use-logged-in-user";

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string>();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPhonePopup, setShowPhonePopup] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const { refreshUser } = useLoggedInUser();

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
      acceptTerms: false,
    },
  });

  const password = watch("password");
  const acceptTerms = watch("acceptTerms");

  const onSubmit = async (data: SignupFormData) => {
    try {
      const result = await signup(data);
      if (result.error) {
        setServerError(result.error);
      } else {
        // Refresh auth state immediately so header and nav update without page refresh
        await refreshUser();

        if (result.user?.role === "USER") {
          router.push("/");
        } else {
          router.push("/dashboard");
        }
      }
    } catch (error) {
      setServerError("Something went wrong. Please try again.");
    }
  };

  const handleGoogleSignUp = async (credential: string) => {
    try {
      setIsGoogleLoading(true);
      setServerError(undefined);

      const result = await googleSignUp(credential, "USER");

      if (result.error) {
        setServerError(result.error);
      } else {
        // Check if user needs to provide phone number
        if (result.requiresPhone && result.user?.id) {
          setCurrentUserId(result.user.id);
          setShowPhonePopup(true);
        } else {
          // Refresh auth state immediately so header and nav update without page refresh
          await refreshUser();

          // Redirect based on user role
          if (result.user?.role === "USER") {
            router.push("/");
          } else {
            router.push("/dashboard");
          }
        }
      }
    } catch (error) {
      setServerError("Something went wrong with Google sign-up.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleError = (error: any) => {
    console.error("Google Sign-Up Error:", error);
    setServerError("Failed to sign up with Google. Please try again.");
    setIsGoogleLoading(false);
  };

  const handlePhoneSuccess = async () => {
    setShowPhonePopup(false);
    // Refresh auth state immediately so header and nav update without page refresh
    await refreshUser();
    // Redirect to home page after phone number is saved
    router.push("/");
  };

  const handlePhoneClose = () => {
    setShowPhonePopup(false);
    // Optionally redirect to login or show a message
    router.push("/login");
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
              Discover amazing events, connect with like-minded people, and
              create unforgettable memories. Your next adventure starts here.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                  🎉
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">Discover Events</h3>
                  <p className="text-sm text-white/80">
                    Find the perfect events that match your interests and
                    schedule.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                  🤝
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">Connect & Network</h3>
                  <p className="text-sm text-white/80">
                    Meet new people, build connections, and expand your network.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                  ⭐
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">Create Memories</h3>
                  <p className="text-sm text-white/80">
                    Attend amazing events and create lasting memories with
                    friends.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-white/5 rounded-lg border border-white/10">
              <p className="text-sm text-white/80">
                "Molle is the best platform to find happening events across
                town"
              </p>
              <div className="mt-2 flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-white/20"></div>
                <div>
                  <p className="text-sm font-medium">- Ajay Shah</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center text-white/60 text-sm">
            © 2024 Molle. All rights reserved.
          </div>
        </div>

        <div className="flex items-center justify-center p-8">
          <div className="w-full max-w-md space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white">Create Account</h2>
              <p className="text-white/80 mt-2">
                Get started with your free account
              </p>
            </div>

            {serverError && (
              <div className="p-3 rounded-md bg-red-500/10 border border-red-500/50 text-red-500">
                {serverError}
              </div>
            )}

            {/* Google Sign-Up Section */}
            <div className="space-y-4">
              <div className="flex justify-center">
                <GoogleSignInButton
                  onSuccess={handleGoogleSignUp}
                  onError={handleGoogleError}
                  text="signup_with"
                  theme="outline"
                  size="large"
                  width={350}
                  disabled={isGoogleLoading || showPhonePopup}
                />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[#121212] px-2 text-white/70">
                    Or continue with email
                  </span>
                </div>
              </div>
            </div>

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
                <Label htmlFor="phone" className="text-white">
                  Mobile Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your 10-digit mobile number"
                  className="bg-muted border-white/20 text-white"
                  {...register("phone")}
                />
                <FormError message={errors.phone?.message} />
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
                <FormError message={errors.confirmPassword?.message} />
              </div>

              {/* Terms and Conditions Checkbox */}
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="acceptTerms"
                  checked={acceptTerms}
                  onCheckedChange={(checked) =>
                    setValue("acceptTerms", checked === true)
                  }
                  className="border-white/20 data-[state=checked]:bg-violet-500 data-[state=checked]:border-violet-500"
                />
                <div className="space-y-1 leading-none">
                  <Label
                    htmlFor="acceptTerms"
                    className="text-sm cursor-pointer text-white"
                  >
                    I agree to the{" "}
                    <Link
                      href="/terms"
                      className="text-primary hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Terms & Conditions
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/privacy"
                      className="text-primary hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Privacy Policy
                    </Link>
                  </Label>
                </div>
              </div>
              <FormError message={errors.acceptTerms?.message} />

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || !acceptTerms}
              >
                {isSubmitting ? "Creating account..." : "Create Account"}
              </Button>
            </form>

            <p className="text-center text-sm text-white/70">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Log in here
              </Link>
            </p>
          </div>
        </div>
      </div>

      {showPhonePopup && (
        <PhoneNumberPopup
          userId={currentUserId}
          onSuccess={handlePhoneSuccess}
          onClose={handlePhoneClose}
        />
      )}
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
