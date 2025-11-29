"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SignupFormData,
  LoginFormData,
  PhoneFormData,
} from "@/lib/validations/auth";
import { db } from "@/lib/db";
import { hash, compare } from "bcryptjs";
import { sign } from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { UserRole } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

function createToken(userId: string) {
  return sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set({
    name: "auth-token",
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function signup(data: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  referralCode?: string;
}) {
  try {
    const existingUser = await db.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return { error: "User with this email already exists" };
    }

    // Check if phone number already exists
    const existingPhoneUser = await db.user.findUnique({
      where: { phone: data.phone },
    });

    if (existingPhoneUser) {
      return { error: "User with this phone number already exists" };
    }

    const hashedPassword = await hash(data.password, 10);

    // Handle REFERRER role with optional referral code
    if (data.role === UserRole.REFERRER) {
      let userData: any = {
        name: data.fullName,
        email: data.email,
        phone: data.phone,
        password: hashedPassword,
        role: data.role,
      };

      // If referral code is provided, try to validate and connect it
      if (data.referralCode) {
        const referrerCodeRecord = await db.hostReferrerCode.findUnique({
          where: {
            code: data.referralCode,
          },
          include: {
            host: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        if (referrerCodeRecord) {
          userData.usedReferrerCode = {
            connect: {
              id: referrerCodeRecord.id,
            },
          };
          userData.hostReferrers = {
            connect: {
              id: referrerCodeRecord.host.id,
            },
          };
        }
      }

      try {
        const user = await db.user.create({
          data: userData,
        });

        // Create token
        const token = sign({ userId: user.id }, JWT_SECRET, {
          expiresIn: "7d",
        });

        // Set cookie
        await setAuthCookie(token);

        return { success: true };
      } catch (error) {
        console.error("Referrer signup error:", error);
        return { error: "Failed to create referrer account" };
      }
    }

    const user = await db.user.create({
      data: {
        name: data.fullName,
        email: data.email,
        phone: data.phone,
        password: hashedPassword,
        role: data.role,
      },
    });

    const token = sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    await setAuthCookie(token);

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  } catch (error) {
    console.error("Signup error:", error);
    return { error: "Something went wrong during signup" };
  }
}

export async function login(data: LoginFormData) {
  try {
    const user = await db.user.findUnique({
      where: { email: data.email },
    });

    if (!user || !user.password) {
      console.error("Login failed: User not found or no password set");
      return { error: "Invalid credentials" };
    }

    const isValid = await compare(data.password, user.password);

    if (!isValid) {
      console.error("Login failed: Invalid password");
      return { error: "Invalid credentials" };
    }

    const token = createToken(user.id);

    try {
      await setAuthCookie(token);
    } catch (cookieError) {
      console.error("Failed to set auth cookie:", cookieError);
      return { error: "Authentication failed" };
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  } catch (error) {
    console.error("Login error:", error);
    return { error: "Something went wrong" };
  }
}

export async function googleSignIn(
  credential: string,
  role?: UserRole,
  referralCode?: string
) {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return { error: "Invalid Google credentials" };
    }

    let user = await db.user.findUnique({
      where: { email: payload.email },
    });

    if (!user) {
      // Create new user with specified role or default to USER
      const userRole = role || UserRole.USER;
      let userData: any = {
        email: payload.email,
        name: payload.name || payload.email.split("@")[0],
        googleId: payload.sub,
        role: userRole,
      };

      // Handle referrer code for REFERRER role
      if (userRole === UserRole.REFERRER && referralCode) {
        try {
          const referrerCodeRecord = await db.hostReferrerCode.findUnique({
            where: { code: referralCode },
            include: { host: { select: { id: true, name: true } } },
          });

          if (referrerCodeRecord) {
            userData.usedReferrerCode = {
              connect: { id: referrerCodeRecord.id },
            };
            userData.hostReferrers = {
              connect: { id: referrerCodeRecord.host.id },
            };
          }
        } catch (error) {
          console.error("Error connecting referrer code:", error);
        }
      }

      user = await db.user.create({ data: userData });

      // Return user without phone number to trigger phone number collection
      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        requiresPhone: !user.phone,
      };
    } else if (!user.googleId) {
      // Link Google account to existing user
      user = await db.user.update({
        where: { id: user.id },
        data: { googleId: payload.sub },
      });
    }

    const token = createToken(user.id);
    await setAuthCookie(token);

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      requiresPhone: !user.phone,
    };
  } catch (error) {
    console.error("Google sign-in error:", error);
    return { error: "Something went wrong with Google sign-in" };
  }
}

// New function specifically for Google signup with role selection
export async function googleSignUp(
  credential: string,
  role: UserRole,
  referralCode?: string
) {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return { error: "Invalid Google credentials" };
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: payload.email },
    });

    if (existingUser) {
      return {
        error:
          "An account with this email already exists. Please sign in instead.",
      };
    }

    // Create new user with specified role
    let userData: any = {
      email: payload.email,
      name: payload.name || payload.email.split("@")[0],
      googleId: payload.sub,
      role: role,
    };

    // Handle referrer code for REFERRER role
    if (role === UserRole.REFERRER && referralCode) {
      try {
        const referrerCodeRecord = await db.hostReferrerCode.findUnique({
          where: { code: referralCode },
          include: { host: { select: { id: true, name: true } } },
        });

        if (referrerCodeRecord) {
          userData.usedReferrerCode = {
            connect: { id: referrerCodeRecord.id },
          };
          userData.hostReferrers = {
            connect: { id: referrerCodeRecord.host.id },
          };
        }
      } catch (error) {
        console.error("Error connecting referrer code:", error);
      }
    }

    const user = await db.user.create({ data: userData });

    const token = createToken(user.id);
    await setAuthCookie(token);

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      requiresPhone: !user.phone,
    };
  } catch (error) {
    console.error("Google sign-up error:", error);
    return { error: "Something went wrong with Google sign-up" };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.set({
    name: "auth-token",
    value: "",
    expires: new Date(0),
  });
  redirect("/login");
}

// Function to handle signup with referrer code validation
export async function handleReferrerSignup(
  userData: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  },
  referrerCode: string
) {
  try {
    // If no referrer code or user is not a REFERRER, proceed with normal signup
    if (!referrerCode || userData.role !== UserRole.REFERRER) {
      return {
        success: true,
        userData,
      };
    }

    // Validate the referrer code
    const referrerCodeRecord = await db.hostReferrerCode.findUnique({
      where: {
        code: referrerCode,
      },
      include: {
        host: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!referrerCodeRecord) {
      return {
        success: false,
        error: "Invalid referrer code",
      };
    }

    // Associate the REFERRER with the HOST who created the code
    return {
      success: true,
      userData: {
        ...userData,
        referrerCodeId: referrerCodeRecord.id,
        hostId: referrerCodeRecord.host.id,
      },
    };
  } catch (error) {
    console.error("Error handling referrer signup:", error);
    return {
      success: false,
      error: "Failed to process referrer code",
    };
  }
}

export async function updateUserPhone(userId: string, phone: string) {
  try {
    // Check if phone number already exists for another user
    const existingPhoneUser = await db.user.findUnique({
      where: { phone: phone },
    });

    if (existingPhoneUser && existingPhoneUser.id !== userId) {
      return { error: "Phone number already exists" };
    }

    const user = await db.user.update({
      where: { id: userId },
      data: { phone: phone },
    });

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  } catch (error) {
    console.error("Error updating user phone:", error);
    return { error: "Failed to update phone number" };
  }
}

export async function validateReferrerCode(code: string) {
  try {
    const referrerCode = await db.hostReferrerCode.findUnique({
      where: {
        code,
      },
      include: {
        host: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!referrerCode) {
      return { valid: false, error: "Invalid referrer code" };
    }

    return {
      valid: true,
      hostId: referrerCode.host.id,
      hostName: referrerCode.host.name,
      referrerCodeId: referrerCode.id,
    };
  } catch (error) {
    console.error("Error validating referrer code:", error);
    return { valid: false, error: "Failed to validate referrer code" };
  }
}

// Generate a 6-digit verification code
function generateResetCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function requestPasswordReset(email: string) {
  try {
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      return { success: true };
    }

    // Generate a 6-digit code
    const resetCode = generateResetCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Delete any existing reset tokens for this user
    await db.verificationToken.deleteMany({
      where: { identifier: email },
    });

    // Create new verification token
    await db.verificationToken.create({
      data: {
        identifier: email,
        token: resetCode,
        expires: expiresAt,
      },
    });

    // Send email with reset code
    const { sendPasswordResetEmail } = await import("@/lib/email");
    await sendPasswordResetEmail(user.name, user.email, resetCode);

    return { success: true };
  } catch (error) {
    console.error("Error requesting password reset:", error);
    return { error: "Failed to send reset code. Please try again." };
  }
}

export async function verifyResetCode(email: string, code: string) {
  try {
    const verificationToken = await db.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier: email,
          token: code,
        },
      },
    });

    if (!verificationToken) {
      return { error: "Invalid verification code" };
    }

    if (verificationToken.expires < new Date()) {
      // Delete expired token
      await db.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: email,
            token: code,
          },
        },
      });
      return { error: "Verification code has expired" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error verifying reset code:", error);
    return { error: "Failed to verify code. Please try again." };
  }
}

export async function resetPassword(
  email: string,
  code: string,
  newPassword: string
) {
  try {
    // Verify the code first
    const verificationResult = await verifyResetCode(email, code);
    if (verificationResult.error) {
      return verificationResult;
    }

    // Hash the new password
    const hashedPassword = await hash(newPassword, 10);

    // Update user's password
    await db.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    // Delete the used verification token
    await db.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: email,
          token: code,
        },
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error resetting password:", error);
    return { error: "Failed to reset password. Please try again." };
  }
}
