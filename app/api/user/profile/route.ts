import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verify } from "jsonwebtoken";
import { db } from "@/lib/db";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token");

    if (!token || !token.value) {
      return NextResponse.json(
        { error: "No authentication token found" },
        { status: 401 }
      );
    }

    let decoded;
    try {
      decoded = verify(token.value, JWT_SECRET) as { userId: string };
    } catch (verifyError) {
      return NextResponse.json(
        { error: "Invalid authentication token" },
        { status: 401 }
      );
    }

    if (!decoded.userId) {
      return NextResponse.json(
        { error: "Invalid token payload" },
        { status: 401 }
      );
    }

    const [user, userPreferences] = await Promise.all([
      db.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatar: true,
          bio: true,
          birthday: true,
          gender: true,
          identity: true,
          role: true,
          status: true,
          walletBalance: true,
          adminWallet: true,
          referralCode: true,
          createdAt: true,
          updatedAt: true,
          activePackageId: true,
          subscriptionEndDate: true,
          activePackage: {
            select: {
              id: true,
              name: true,
              price: true,
              dailySwipeLimit: true,
              allowBadge: true,
            },
          },
          kycRequests: {
            where: { status: "APPROVED" },
            select: { status: true },
            take: 1,
          },
          datingKycRequests: {
            select: { status: true },
          },
        },
      }),
      db.userPreference.findUnique({
        where: { userId: decoded.userId },
        select: { photos: true, gender: true },
      }),
    ]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Determine KYC status
    let kycStatus: "PENDING" | "APPROVED" | "REJECTED" | null = null;
    if (user.kycRequests.length > 0) {
      kycStatus = user.kycRequests[0].status;
    }

    // Determine dating KYC status
    let datingKycStatus:
      | "NOT_STARTED"
      | "PENDING"
      | "APPROVED"
      | "REJECTED"
      | null = null;
    if (user.datingKycRequests) {
      datingKycStatus = user.datingKycRequests.status;
    }

    const profileData = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      bio: user.bio,
      birthday: user.birthday,
      gender: user.gender,
      identity: user.identity,
      photos: userPreferences?.photos || [],
      role: user.role,
      status: user.status,
      walletBalance: Number(user.walletBalance),
      adminWallet: Number(user.adminWallet),
      referralCode: user.referralCode,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      activePackageId: user.activePackageId,
      subscriptionEndDate: user.subscriptionEndDate,
      activePackage: user.activePackage,
      kycStatus,
      datingKycStatus,
    };

    return NextResponse.json({ success: true, data: profileData });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token");

    if (!token || !token.value) {
      return NextResponse.json(
        { error: "No authentication token found" },
        { status: 401 }
      );
    }

    let decoded;
    try {
      decoded = verify(token.value, JWT_SECRET) as { userId: string };
    } catch (verifyError) {
      return NextResponse.json(
        { error: "Invalid authentication token" },
        { status: 401 }
      );
    }

    if (!decoded.userId) {
      return NextResponse.json(
        { error: "Invalid token payload" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, bio, avatar, phone, birthday, identity, gender, photos } =
      body;

    // Only update provided fields
    const updateData: any = {};
    if (typeof name === "string") updateData.name = name;
    if (typeof bio === "string") updateData.bio = bio;
    if (typeof avatar === "string") updateData.avatar = avatar;
    if (typeof phone === "string") updateData.phone = phone;
    if (typeof birthday === "string" || birthday instanceof Date)
      updateData.birthday = birthday;
    if (typeof identity === "string") updateData.identity = identity;
    if (typeof gender === "string") updateData.gender = gender;

    // Handle photos update in user preferences
    if (Array.isArray(photos)) {
      await db.userPreference.upsert({
        where: { userId: decoded.userId },
        update: { photos },
        create: { userId: decoded.userId, photos },
      });
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const [updatedUser, updatedUserPreferences] = await Promise.all([
      db.user.update({
        where: { id: decoded.userId },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatar: true,
          bio: true,
          birthday: true,
          gender: true,
          identity: true,
          role: true,
          status: true,
          walletBalance: true,
          adminWallet: true,
          referralCode: true,
          createdAt: true,
          updatedAt: true,
          activePackageId: true,
          subscriptionEndDate: true,
          activePackage: {
            select: {
              id: true,
              name: true,
              price: true,
              dailySwipeLimit: true,
              allowBadge: true,
            },
          },
          kycRequests: {
            where: { status: "APPROVED" },
            select: { status: true },
            take: 1,
          },
          datingKycRequests: {
            select: { status: true },
          },
        },
      }),
      db.userPreference.findUnique({
        where: { userId: decoded.userId },
        select: { photos: true },
      }),
    ]);

    // Determine KYC status
    let kycStatus: "PENDING" | "APPROVED" | "REJECTED" | null = null;
    if (updatedUser.kycRequests.length > 0) {
      kycStatus = updatedUser.kycRequests[0].status;
    }

    // Determine dating KYC status
    let datingKycStatus:
      | "NOT_STARTED"
      | "PENDING"
      | "APPROVED"
      | "REJECTED"
      | null = null;
    if (updatedUser.datingKycRequests) {
      datingKycStatus = updatedUser.datingKycRequests.status;
    }

    const profileData = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      avatar: updatedUser.avatar,
      bio: updatedUser.bio,
      birthday: updatedUser.birthday,
      gender: updatedUser.gender,
      identity: updatedUser.identity,
      photos: updatedUserPreferences?.photos || [],
      role: updatedUser.role,
      status: updatedUser.status,
      walletBalance: Number(updatedUser.walletBalance),
      adminWallet: Number(updatedUser.adminWallet),
      referralCode: updatedUser.referralCode,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
      activePackageId: updatedUser.activePackageId,
      subscriptionEndDate: updatedUser.subscriptionEndDate,
      activePackage: updatedUser.activePackage,
      kycStatus,
      datingKycStatus,
    };

    return NextResponse.json({ success: true, data: profileData });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
