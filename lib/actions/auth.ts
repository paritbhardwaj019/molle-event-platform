"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignupFormData, LoginFormData } from "@/lib/validations/auth";
import { db } from "@/lib/db";
import { hash, compare } from "bcryptjs";
import { sign } from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { UserRole } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

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
    maxAge: 7 * 24 * 60 * 60,
  });
}

export async function signup(data: {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  agreedToTerms: boolean;
  referralCode?: string;
}) {
  console.log("signup data", data);

  try {
    const existingUser = await db.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return { error: "User with this email already exists" };
    }

    const hashedPassword = await hash(data.password, 10);

    if (data.role === UserRole.REFERRER && data.referralCode) {
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

      console.log("referrerCodeRecord", referrerCodeRecord);

      if (!referrerCodeRecord) {
        return { error: "Invalid referrer code" };
      }

      try {
        const user = await db.user.create({
          data: {
            name: data.fullName,
            email: data.email,
            password: hashedPassword,
            role: data.role,
            usedReferrerCode: {
              connect: {
                id: referrerCodeRecord.id,
              },
            },
            hostReferrers: {
              connect: {
                id: referrerCodeRecord.host.id,
              },
            },
          },
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
        password: hashedPassword,
        role: data.role,
      },
    });

    const token = sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    await setAuthCookie(token);

    return { success: true };
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

    return { success: true };
  } catch (error) {
    console.error("Login error:", error);
    return { error: "Something went wrong" };
  }
}

export async function googleSignIn(credential: string) {
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
      user = await db.user.create({
        data: {
          email: payload.email,
          name: payload.name || "Google User",
          googleId: payload.sub,
          role: "USER",
        },
      });
    } else if (!user.googleId) {
      user = await db.user.update({
        where: { id: user.id },
        data: { googleId: payload.sub },
      });
    }

    const token = createToken(user.id);
    await setAuthCookie(token);

    return { success: true };
  } catch (error) {
    console.error("Google sign-in error:", error);
    return { error: "Something went wrong" };
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
