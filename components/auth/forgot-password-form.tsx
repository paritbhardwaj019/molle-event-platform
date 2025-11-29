"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/ui/form-error";
import {
  requestPasswordReset,
  verifyResetCode,
  resetPassword,
} from "@/lib/actions/auth";

// Validation schemas
const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const codeSchema = z.object({
  code: z.string().length(6, "Verification code must be 6 digits"),
});

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain uppercase, lowercase, and number"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type EmailFormData = z.infer<typeof emailSchema>;
type CodeFormData = z.infer<typeof codeSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

type ForgotPasswordStep = "email" | "code" | "password";

interface ForgotPasswordFormProps {
  onBack: () => void;
  onSuccess: () => void;
}

export default function ForgotPasswordForm({
  onBack,
  onSuccess,
}: ForgotPasswordFormProps) {
  const [step, setStep] = useState<ForgotPasswordStep>("email");
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [serverError, setServerError] = useState<string>();
  const [successMessage, setSuccessMessage] = useState<string>();

  // Email form
  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  // Code form
  const codeForm = useForm<CodeFormData>({
    resolver: zodResolver(codeSchema),
  });

  // Password form
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const onEmailSubmit = async (data: EmailFormData) => {
    try {
      setServerError(undefined);
      const result = await requestPasswordReset(data.email);

      if (result.error) {
        setServerError(result.error);
      } else {
        setEmail(data.email);
        setSuccessMessage(
          "A verification code has been sent to your email address."
        );
        setStep("code");
      }
    } catch (error) {
      setServerError("Something went wrong. Please try again.");
    }
  };

  const onCodeSubmit = async (data: CodeFormData) => {
    try {
      setServerError(undefined);
      const result = await verifyResetCode(email, data.code);

      if (result.error) {
        setServerError(result.error);
      } else {
        setVerificationCode(data.code);
        setSuccessMessage("Code verified! Please enter your new password.");
        setStep("password");
      }
    } catch (error) {
      setServerError("Something went wrong. Please try again.");
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    try {
      setServerError(undefined);
      const result = await resetPassword(
        email,
        verificationCode,
        data.password
      );

      if (result.error) {
        setServerError(result.error);
      } else {
        setSuccessMessage(
          "Password reset successfully! You can now sign in with your new password."
        );
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (error) {
      setServerError("Something went wrong. Please try again.");
    }
  };

  const handleResendCode = async () => {
    try {
      setServerError(undefined);
      setSuccessMessage(undefined);
      const result = await requestPasswordReset(email);

      if (result.error) {
        setServerError(result.error);
      } else {
        setSuccessMessage(
          "A new verification code has been sent to your email."
        );
      }
    } catch (error) {
      setServerError("Failed to resend code. Please try again.");
    }
  };

  return (
    <div className="w-full max-w-md space-y-6 bg-white p-8 rounded-lg shadow-lg">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Reset Password</h2>
        <p className="text-gray-600 mt-2">
          {step === "email" &&
            "Enter your email to receive a verification code"}
          {step === "code" && "Enter the 6-digit code sent to your email"}
          {step === "password" && "Create a new password for your account"}
        </p>
      </div>

      {serverError && (
        <div className="p-3 rounded-md bg-red-500/10 border border-red-500/50 text-red-500">
          {serverError}
        </div>
      )}

      {successMessage && (
        <div className="p-3 rounded-md bg-green-500/10 border border-green-500/50 text-green-500">
          {successMessage}
        </div>
      )}

      {/* Step 1: Email */}
      {step === "email" && (
        <form
          onSubmit={emailForm.handleSubmit(onEmailSubmit)}
          className="space-y-4"
        >
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              {...emailForm.register("email")}
            />
            <FormError message={emailForm.formState.errors.email?.message} />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={emailForm.formState.isSubmitting}
          >
            {emailForm.formState.isSubmitting
              ? "Sending code..."
              : "Send verification code"}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={onBack}
          >
            ← Back to sign in
          </Button>
        </form>
      )}

      {/* Step 2: Verification Code */}
      {step === "code" && (
        <form
          onSubmit={codeForm.handleSubmit(onCodeSubmit)}
          className="space-y-4"
        >
          <div>
            <Label htmlFor="code">Verification Code</Label>
            <Input
              id="code"
              type="text"
              placeholder="Enter 6-digit code"
              maxLength={6}
              className="text-center text-2xl tracking-widest font-mono"
              {...codeForm.register("code")}
            />
            <FormError message={codeForm.formState.errors.code?.message} />
          </div>

          <div className="text-center text-sm text-gray-600">
            Didn't receive the code?{" "}
            <button
              type="button"
              onClick={handleResendCode}
              className="text-primary hover:underline"
            >
              Resend code
            </button>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={codeForm.formState.isSubmitting}
          >
            {codeForm.formState.isSubmitting ? "Verifying..." : "Verify code"}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => {
              setStep("email");
              setServerError(undefined);
              setSuccessMessage(undefined);
            }}
          >
            ← Change email
          </Button>
        </form>
      )}

      {/* Step 3: New Password */}
      {step === "password" && (
        <form
          onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
          className="space-y-4"
        >
          <div>
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter new password"
              {...passwordForm.register("password")}
            />
            <FormError
              message={passwordForm.formState.errors.password?.message}
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm new password"
              {...passwordForm.register("confirmPassword")}
            />
            <FormError
              message={passwordForm.formState.errors.confirmPassword?.message}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={passwordForm.formState.isSubmitting}
          >
            {passwordForm.formState.isSubmitting
              ? "Resetting password..."
              : "Reset password"}
          </Button>
        </form>
      )}
    </div>
  );
}
