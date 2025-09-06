"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

import { FormError } from "@/components/ui/form-error";
import { PasswordStrength } from "@/components/ui/password-strength";
import { GoogleSignInButton } from "@/components/ui/google-signin-button";
import { signupSchema, type SignupFormData } from "@/lib/validations/auth";
import { signup, googleSignUp } from "@/lib/actions/auth";
import { UserRole } from "@prisma/client";

export default function ListShowPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string>();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      role: "HOST",
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
        router.push("/dashboard");
      }
    } catch (error) {
      setServerError("Something went wrong. Please try again.");
    }
  };

  const handleGoogleSignUp = async (credential: string) => {
    try {
      setIsGoogleLoading(true);
      setServerError(undefined);

      const result = await googleSignUp(credential, "HOST" as UserRole);

      if (result.error) {
        setServerError(result.error);
      } else {
        router.push("/dashboard");
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
              List your event with molle and reach thousands of attendees
              organically
            </h1>
            <p className="text-xl text-white/80">
              Create unforgettable experiences, connect with your audience, and
              grow your event hosting business with our powerful platform
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                  🎪
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">Easy Event Creation</h3>
                  <p className="text-sm text-white/80">
                    Set up your event in minutes with our intuitive event
                    builder and management tools.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                  🎫
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">
                    Integrated Ticketing
                  </h3>
                  <p className="text-sm text-white/80">
                    Sell tickets seamlessly with built-in payment processing and
                    instant payouts.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                  📈
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">Powerful Analytics</h3>
                  <p className="text-sm text-white/80">
                    Track attendance, revenue, and audience insights to optimize
                    your events.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                  🌟
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">Marketing Support</h3>
                  <p className="text-sm text-white/80">
                    Promote your events with our built-in marketing tools and
                    featured listings.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-white/5 rounded-lg border border-white/10">
              <p className="text-sm text-white/80">
                "Molle helped us sell out our venue for 3 consecutive months.
                The platform is incredibly user-friendly and the support team is
                amazing!"
              </p>
              <p className="text-sm font-medium mt-2">
                Priya Sharma • Event Producer, ShowTime Events
              </p>
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
                Start Hosting Events
              </h2>
              <p className="text-muted-foreground mt-2">
                Create your host account and list your first show
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
                <Label htmlFor="phone" className="text-white">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your 10-digit phone number"
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
                {errors.confirmPassword && (
                  <FormError message={errors.confirmPassword.message} />
                )}
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
                    >
                      Terms & Conditions
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/privacy"
                      className="text-primary hover:underline"
                    >
                      Privacy Policy
                    </Link>
                  </Label>
                </div>
              </div>
              <FormError message={errors.acceptTerms?.message} />

              <Button
                type="submit"
                className={`w-full transition-colors ${
                  !acceptTerms
                    ? "bg-violet-600/50 text-white/70 cursor-not-allowed"
                    : "bg-violet-600 text-white hover:bg-violet-700"
                }`}
                disabled={isSubmitting || !acceptTerms}
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
                  <div className="w-full border-t border-white/20" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[#121212] px-2 text-white/70">
                    Or continue with
                  </span>
                </div>
              </div>

              {/* Google Sign-Up Section */}
              <div className="flex justify-center">
                <GoogleSignInButton
                  onSuccess={handleGoogleSignUp}
                  onError={handleGoogleError}
                  text="signup_with"
                  theme="outline"
                  size="large"
                  width={350}
                />
              </div>

              <p className="text-center text-sm text-white/70">
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
