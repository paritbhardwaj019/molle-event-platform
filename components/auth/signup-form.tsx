"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { signupSchema, type SignupFormData } from "@/lib/validations/auth";
import { signup, googleSignIn } from "@/lib/actions/auth";

interface SignupFormProps {
  role?: "USER" | "HOST" | "REFERRER";
  initialReferralCode?: string | null;
}

export default function SignupForm({
  role = "USER",
  initialReferralCode = null,
}: SignupFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string>();
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [codeValidation, setCodeValidation] = useState<{
    valid: boolean;
    hostName?: string;
    error?: string;
  } | null>(null);

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
      role: role,
      agreedToTerms: false,
      referralCode: initialReferralCode || "",
    },
  });

  const referralCode = watch("referralCode");

  // Validate referral code when it changes
  useEffect(() => {
    if (role === "REFERRER" && referralCode && referralCode.length >= 6) {
      const validateCode = async () => {
        setIsValidatingCode(true);
        try {
          // Import dynamically to avoid server/client issues
          const { validateReferrerCode } = await import("@/lib/actions/auth");
          const result = await validateReferrerCode(referralCode);

          setCodeValidation(result);
          if (!result.valid) {
            setValue("referralCode", referralCode);
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
    }
  }, [referralCode, role]);

  const onSubmit = async (data: SignupFormData) => {
    // If role is REFERRER and code is invalid, prevent submission
    if (role === "REFERRER" && (!codeValidation || !codeValidation.valid)) {
      setServerError("Please enter a valid referrer code");
      return;
    }

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

        {role === "REFERRER" && (
          <div>
            <Label htmlFor="referralCode" className="text-white">
              Referrer Code
            </Label>
            <Input
              id="referralCode"
              placeholder="Enter your referrer code"
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
              <p className="text-xs text-blue-400 mt-1">Validating code...</p>
            )}
            {codeValidation?.valid && (
              <p className="text-xs text-green-500 mt-1">
                Valid code from host: {codeValidation.hostName}
              </p>
            )}
            {!isValidatingCode && codeValidation?.error && (
              <p className="text-xs text-red-500 mt-1">
                {codeValidation.error}
              </p>
            )}
            {!isValidatingCode && !codeValidation && referralCode && (
              <p className="text-xs text-white/60 mt-1">
                Enter a valid referrer code provided by a host
              </p>
            )}
            <FormError message={errors.referralCode?.message} />
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="terms"
              {...register("agreedToTerms")}
              className={
                role !== "USER"
                  ? "border-white/20 data-[state=checked]:bg-violet-500 data-[state=checked]:border-violet-500"
                  : ""
              }
            />
            <label
              htmlFor="terms"
              className={`text-sm ${
                role !== "USER" ? "text-white" : "text-gray-600"
              }`}
            >
              I agree to the{" "}
              <Link
                href="/terms"
                className={
                  role !== "USER"
                    ? "text-violet-400 hover:text-violet-300"
                    : "text-primary hover:underline"
                }
                target="_blank"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className={
                  role !== "USER"
                    ? "text-violet-400 hover:text-violet-300"
                    : "text-primary hover:underline"
                }
                target="_blank"
              >
                Privacy Policy
              </Link>
            </label>
          </div>
          <FormError message={errors.agreedToTerms?.message} />
        </div>

        <Button
          type="submit"
          className={`w-full ${
            role !== "USER"
              ? "bg-violet-600 text-white hover:bg-violet-700"
              : ""
          }`}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating Account..." : "Create Account"}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div
            className={`w-full border-t ${
              role !== "USER" ? "border-white/10" : "border-gray-200"
            }`}
          />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span
            className={`px-2 ${
              role !== "USER"
                ? "bg-[#121212] text-muted-foreground"
                : "bg-white text-gray-500"
            }`}
          >
            Or continue with
          </span>
        </div>
      </div>

      <div
        id="google-signin"
        className="w-full"
        data-callback="handleGoogleSignIn"
      />

      <p
        className={`text-center text-sm ${
          role !== "USER" ? "text-muted-foreground" : "text-gray-600"
        }`}
      >
        Already have an account?{" "}
        <Link
          href="/login"
          className={
            role !== "USER"
              ? "text-primary hover:underline"
              : "text-primary hover:underline"
          }
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
