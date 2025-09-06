"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
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

function AffiliateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string>();
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [codeValidation, setCodeValidation] = useState<{
    valid: boolean;
    hostName?: string;
    error?: string;
  } | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    trigger,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      role: "REFERRER",
      referralCode: "",
      acceptTerms: false,
    },
  });

  useEffect(() => {
    // Get referral code from URL
    const code = searchParams.get("ref");
    if (code) {
      setReferralCode(code);
      setValue("referralCode", code);
    }
  }, [searchParams, setValue]);

  const password = watch("password");
  const currentReferralCode = watch("referralCode");
  const acceptTerms = watch("acceptTerms");

  // Validate referral code when it changes
  useEffect(() => {
    if (currentReferralCode && currentReferralCode.length >= 6) {
      const validateCode = async () => {
        setIsValidatingCode(true);
        try {
          // Import dynamically to avoid server/client issues
          const { validateReferrerCode } = await import("@/lib/actions/auth");
          const result = await validateReferrerCode(currentReferralCode);

          setCodeValidation(result);
          if (!result.valid) {
            setValue("referralCode", currentReferralCode);
          }
        } catch (error) {
          setCodeValidation({
            valid: false,
            error: "Failed to validate code",
          });
        } finally {
          setIsValidatingCode(false);
        }
      };

      // Debounce the validation
      const timeoutId = setTimeout(validateCode, 500);
      return () => clearTimeout(timeoutId);
    } else if (!currentReferralCode) {
      // Clear validation when code is empty
      setCodeValidation(null);
    }
  }, [currentReferralCode, setValue]);

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

      const result = await googleSignUp(
        credential,
        "REFERRER" as UserRole,
        currentReferralCode || undefined
      );

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
              Join our affiliate program and start earning commissions by
              promoting amazing events. Share your unique referral code or link
              and get rewarded for every successful ticket sale.
            </h1>

            <div className="mt-8 space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                  💰
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">
                    Earn awesome commissions
                  </h3>
                  <p className="text-sm text-white/80">
                    Get competitive commissions on every successful referral and
                    ticket sale.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                  📊
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">Real-time Analytics</h3>
                  <p className="text-sm text-white/80">
                    Track your referrals, conversions, and earnings with our
                    comprehensive dashboard.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                  🎯
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">Marketing Support</h3>
                  <p className="text-sm text-white/80">
                    Access promotional materials, banners, and marketing
                    resources to boost your success.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-white/5 rounded-lg border border-white/10">
              <p className="text-sm text-white/80">
                "I have been an affiliate since 2 months and have earned over 1
                lakh in commissions. Molle makes it so easy to sell tickets!"
              </p>
              <p className="text-sm font-medium mt-2">
                Milan sharma • Top affiliate partneer
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
                Join as an Affiliate
              </h2>
              <p className="text-muted-foreground mt-2">
                Start earning with our affiliate program
                {referralCode && (
                  <span className="ml-1">through a host's invitation</span>
                )}
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

              <div>
                <Label htmlFor="referralCode" className="text-white">
                  Referrer Code (Optional)
                </Label>
                <Input
                  id="referralCode"
                  placeholder="Enter your referrer code (optional)"
                  className={`bg-muted border-white/20 text-white ${
                    codeValidation?.valid
                      ? "border-green-500"
                      : codeValidation?.error
                        ? "border-red-500"
                        : ""
                  }`}
                  {...register("referralCode")}
                />
                {isValidatingCode && (
                  <p className="text-xs text-blue-400 mt-1">
                    Validating code...
                  </p>
                )}
                {codeValidation?.valid && (
                  <p className="text-xs text-green-500 mt-1">
                    <svg
                      className="inline-block w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Code verified for {codeValidation.hostName}
                  </p>
                )}
                {!isValidatingCode && codeValidation?.error && (
                  <p className="text-xs text-red-500 mt-1">
                    {codeValidation.error}
                  </p>
                )}
                {!isValidatingCode &&
                  !codeValidation &&
                  currentReferralCode && (
                    <p className="text-xs text-white/60 mt-1">
                      Enter a valid referrer code provided by a host (optional)
                    </p>
                  )}
                <FormError message={errors.referralCode?.message} />
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
                className="w-full bg-violet-600 text-white hover:bg-violet-700 transition-colors"
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

export default function AffiliatePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#121212] flex items-center justify-center">
          <p className="text-white">Loading...</p>
        </div>
      }
    >
      <AffiliateContent />
    </Suspense>
  );
}
