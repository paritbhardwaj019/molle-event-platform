import { NextResponse } from "next/server";
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

    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        role: true,
        status: true,
        walletBalance: true,
        referralCode: true,
        referredBy: true,
        createdAt: true,
        adminWallet: true,
        hostFeePercentage: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Get current user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
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
    const { name, phone, avatar, birthday, identity } = body;

    // Only update provided fields
    const updateData: any = {};
    if (typeof name === "string") updateData.name = name;
    if (typeof phone === "string") updateData.phone = phone;
    if (typeof avatar === "string") updateData.avatar = avatar;
    if (typeof birthday === "string" || birthday instanceof Date)
      updateData.birthday = birthday;
    if (typeof identity === "string") updateData.identity = identity;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const user = await db.user.update({
      where: { id: decoded.userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        birthday: true,
        identity: true,
        role: true,
        status: true,
        walletBalance: true,
        referralCode: true,
        referredBy: true,
        createdAt: true,
        adminWallet: true,
        hostFeePercentage: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Update current user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
