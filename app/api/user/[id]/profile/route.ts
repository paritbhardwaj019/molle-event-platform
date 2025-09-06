import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Fetch user profile
    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        birthday: true,
        gender: true,
        role: true,
        createdAt: true,
        userPreferences: {
          select: {
            interests: true,
            photos: true,
            connectionTypes: true,
            showAge: true,
            showLocation: true,
            cityId: true,
            bio: true,
            age: true,
            gender: true,
            relationshipStatus: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // For privacy, don't return email unless it's the user's own profile
    const profileData = {
      ...user,
      email: user.id === session.user.id ? user.email : undefined,
    };

    return NextResponse.json({
      success: true,
      data: profileData,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
