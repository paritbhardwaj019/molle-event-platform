"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { FormError } from "@/components/ui/form-error";
import {
  GoogleSignInButton,
  CustomGoogleSignInButton,
} from "@/components/ui/google-signin-button";
import { signupSchema, type SignupFormData } from "@/lib/validations/auth";
import { signup, googleSignUp } from "@/lib/actions/auth";
import { UserRole } from "@prisma/client";
import { auth } from "@/lib/auth";

type SignupRole = Exclude<UserRole, "ADMIN">;

interface SignupFormProps {
  role?: SignupRole;
  initialReferralCode?: string | null;
}

export default function SignupForm({
  role = "USER" as SignupRole,
  initialReferralCode = null,
}: SignupFormProps) {
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
      role: role,
      referralCode: initialReferralCode || "",
      acceptTerms: false,
    },
  });

  useEffect(() => {
    if (initialReferralCode) {
      setValue("referralCode", initialReferralCode);
    }
  }, [initialReferralCode, setValue]);

  const watchedRole = watch("role");
  const watchedReferralCode = watch("referralCode");
  const acceptTerms = watch("acceptTerms");

  const onSubmit = async (data: SignupFormData) => {
    try {
      const result = await signup(data);
      if (result.error) {
        setServerError(result.error);
      } else {
        // Redirect based on user role
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

      const result = await googleSignUp(
        credential,
        watchedRole,
        watchedReferralCode || undefined
      );

      if (result.error) {
        setServerError(result.error);
      } else {
        // Check if user needs to provide phone number
        if (result.requiresPhone && result.user?.id) {
          // For the signup form component, we'll redirect to the main signup page
          // which will handle the phone number popup
          router.push("/signup?googleSignup=true");
        } else {
          // Redirect based on user role
          if (watchedRole === "USER") {
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

  return (
    <div className="w-full space-y-6">
      {role === "USER" && (
        <div className="text-center bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900">
            Create an Account
          </h2>
          <p className="text-gray-600 mt-2">
            Join Molle and start your journey
          </p>
        </div>
      )}

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
            disabled={isGoogleLoading}
          />
        </div>

        {/* Fallback Custom Button */}
        <CustomGoogleSignInButton
          onClick={() => {
            if (window.google && window.google.accounts) {
              window.google.accounts.id.prompt();
            }
          }}
          disabled={isGoogleLoading}
          className={
            role !== "USER"
              ? "text-white bg-white/10 border-white/20 hover:bg-white/20"
              : ""
          }
        >
          {isGoogleLoading ? "Creating account..." : "Sign up with Google"}
        </CustomGoogleSignInButton>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div
              className={`w-full border-t ${
                role !== "USER" ? "border-white/20" : "border-gray-200"
              }`}
            />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span
              className={`px-2 ${
                role !== "USER"
                  ? "bg-[#121212] text-white/70"
                  : "bg-white text-gray-500"
              }`}
            >
              Or continue with email
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label
            htmlFor="fullName"
            className={role !== "USER" ? "text-white" : ""}
          >
            Full Name
          </Label>
          <Input
            id="fullName"
            placeholder="Enter your full name"
            className={
              role !== "USER" ? "bg-muted border-white/20 text-white" : ""
            }
            {...register("fullName")}
          />
          <FormError message={errors.fullName?.message} />
        </div>

        <div>
          <Label
            htmlFor="email"
            className={role !== "USER" ? "text-white" : ""}
          >
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            className={
              role !== "USER" ? "bg-muted border-white/20 text-white" : ""
            }
            {...register("email")}
          />
          <FormError message={errors.email?.message} />
        </div>

        <div>
          <Label
            htmlFor="phone"
            className={role !== "USER" ? "text-white" : ""}
          >
            Mobile Number
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="Enter your 10-digit mobile number"
            className={
              role !== "USER" ? "bg-muted border-white/20 text-white" : ""
            }
            {...register("phone")}
          />
          <FormError message={errors.phone?.message} />
        </div>

        <div>
          <Label
            htmlFor="password"
            className={role !== "USER" ? "text-white" : ""}
          >
            Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="Create a password"
            className={
              role !== "USER" ? "bg-muted border-white/20 text-white" : ""
            }
            {...register("password")}
          />
          <FormError message={errors.password?.message} />
        </div>

        <div>
          <Label
            htmlFor="confirmPassword"
            className={role !== "USER" ? "text-white" : ""}
          >
            Confirm Password
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Confirm your password"
            className={
              role !== "USER" ? "bg-muted border-white/20 text-white" : ""
            }
            {...register("confirmPassword")}
          />
          <FormError message={errors.confirmPassword?.message} />
        </div>

        <div>
          <Label htmlFor="role" className={role !== "USER" ? "text-white" : ""}>
            Account Type
          </Label>
          <Select
            value={watchedRole}
            onValueChange={(value) => setValue("role", value as SignupRole)}
          >
            <SelectTrigger
              className={
                role !== "USER" ? "bg-muted border-white/20 text-white" : ""
              }
            >
              <SelectValue placeholder="Select account type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USER">User - Attend Events</SelectItem>
              <SelectItem value="HOST">Host - Create Events</SelectItem>
              <SelectItem value="REFERRER">
                Referrer - Earn Commissions
              </SelectItem>
            </SelectContent>
          </Select>
          <FormError message={errors.role?.message} />
        </div>

        {watchedRole === "REFERRER" && (
          <div>
            <Label
              htmlFor="referralCode"
              className={role !== "USER" ? "text-white" : ""}
            >
              Referral Code (Optional)
            </Label>
            <Input
              id="referralCode"
              placeholder="Enter referral code"
              className={
                role !== "USER" ? "bg-muted border-white/20 text-white" : ""
              }
              {...register("referralCode")}
            />
            <FormError message={errors.referralCode?.message} />
          </div>
        )}

        {/* Terms and Conditions Checkbox */}
        <div className="flex items-start space-x-3">
          <Checkbox
            id="acceptTerms"
            checked={acceptTerms}
            onCheckedChange={(checked) =>
              setValue("acceptTerms", checked === true)
            }
            className={
              role !== "USER"
                ? "border-white/20 data-[state=checked]:bg-violet-500 data-[state=checked]:border-violet-500"
                : ""
            }
          />
          <div className="space-y-1 leading-none">
            <Label
              htmlFor="acceptTerms"
              className={`text-sm cursor-pointer ${
                role !== "USER" ? "text-white" : ""
              }`}
            >
              I agree to the{" "}
              <Link href="/terms" className="text-primary hover:underline">
                Terms & Conditions
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-primary hover:underline">
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

      <p
        className={`text-center text-sm ${
          role !== "USER" ? "text-white/70" : "text-gray-600"
        }`}
      >
        Already have an account?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Sign in here
        </Link>
      </p>
    </div>
  );
}
