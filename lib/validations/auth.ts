import * as z from "zod";
import { UserRole } from "@prisma/client";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean().optional(),
});

export const signupSchema = z
  .object({
    fullName: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(50, "Full name must be less than 50 characters"),
    email: z.string().email("Please enter a valid email address"),
    phone: z
      .string()
      .regex(
        /^[6-9]\d{9}$/,
        "Please enter a valid 10-digit Indian mobile number"
      )
      .min(10, "Phone number must be 10 digits")
      .max(10, "Phone number must be 10 digits"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[@$!%*?&]/,
        "Password must contain at least one special character (@$!%*?&)"
      ),
    confirmPassword: z.string(),
    role: z.enum([UserRole.USER, UserRole.HOST, UserRole.REFERRER]),
    referralCode: z.string().optional(),
    acceptTerms: z
      .boolean()
      .refine(
        (val) => val === true,
        "You must accept the Terms & Conditions and Privacy Policy"
      ),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const phoneSchema = z.object({
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number")
    .min(10, "Phone number must be 10 digits")
    .max(10, "Phone number must be 10 digits"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type PhoneFormData = z.infer<typeof phoneSchema>;
