"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function followHost(hostId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to follow a host",
      };
    }

    // Check if user is trying to follow themselves (if they are a host)
    if (session.user.id === hostId) {
      return {
        success: false,
        error: "You cannot follow yourself",
      };
    }

    // Check if the target user is actually a host
    const host = await db.user.findUnique({
      where: { id: hostId },
      select: { role: true, name: true },
    });

    if (!host) {
      return {
        success: false,
        error: "Host not found",
      };
    }

    if (host.role !== "HOST") {
      return {
        success: false,
        error: "You can only follow hosts",
      };
    }

    // Check if already following
    const existingFollow = await db.follow.findUnique({
      where: {
        followerId_hostId: {
          followerId: session.user.id,
          hostId: hostId,
        },
      },
    });

    if (existingFollow) {
      return {
        success: false,
        error: "You are already following this host",
      };
    }

    // Create the follow relationship
    await db.follow.create({
      data: {
        followerId: session.user.id,
        hostId: hostId,
      },
    });

    revalidatePath("/events");
    revalidatePath("/host");
    revalidatePath("/dashboard/followers");
    revalidatePath(`/host/${hostId}`);

    return {
      success: true,
      message: `You are now following ${host.name}`,
    };
  } catch (error) {
    console.error("Error following host:", error);
    return {
      success: false,
      error: "Failed to follow host",
    };
  }
}

export async function unfollowHost(hostId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to unfollow a host",
      };
    }

    // Check if the target user is actually a host
    const host = await db.user.findUnique({
      where: { id: hostId },
      select: { role: true, name: true },
    });

    if (!host) {
      return {
        success: false,
        error: "Host not found",
      };
    }

    // Find and delete the follow relationship
    const existingFollow = await db.follow.findUnique({
      where: {
        followerId_hostId: {
          followerId: session.user.id,
          hostId: hostId,
        },
      },
    });

    if (!existingFollow) {
      return {
        success: false,
        error: "You are not following this host",
      };
    }

    await db.follow.delete({
      where: {
        id: existingFollow.id,
      },
    });

    revalidatePath("/events");
    revalidatePath("/host");
    revalidatePath("/dashboard/followers");
    revalidatePath(`/host/${hostId}`);

    return {
      success: true,
      message: `You have unfollowed ${host.name}`,
    };
  } catch (error) {
    console.error("Error unfollowing host:", error);
    return {
      success: false,
      error: "Failed to unfollow host",
    };
  }
}

export async function isFollowingHost(hostId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: true,
        data: { isFollowing: false },
      };
    }

    const follow = await db.follow.findUnique({
      where: {
        followerId_hostId: {
          followerId: session.user.id,
          hostId: hostId,
        },
      },
    });

    return {
      success: true,
      data: { isFollowing: !!follow },
    };
  } catch (error) {
    console.error("Error checking follow status:", error);
    return {
      success: false,
      error: "Failed to check follow status",
    };
  }
}

export async function getHostFollowers(hostId?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to view followers",
      };
    }

    // If no hostId provided, use current user (for host dashboard)
    const targetHostId = hostId || session.user.id;

    // Check if user has permission to view followers
    if (targetHostId !== session.user.id && session.user.role !== "ADMIN") {
      return {
        success: false,
        error: "You don't have permission to view these followers",
      };
    }

    const followers = await db.follow.findMany({
      where: {
        hostId: targetHostId,
      },
      include: {
        follower: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedFollowers = followers.map((follow) => ({
      id: follow.id,
      followedAt: follow.createdAt,
      user: follow.follower,
    }));

    return {
      success: true,
      data: formattedFollowers,
    };
  } catch (error) {
    console.error("Error fetching followers:", error);
    return {
      success: false,
      error: "Failed to fetch followers",
    };
  }
}

export async function removeFollower(followId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to remove followers",
      };
    }

    // Find the follow relationship and verify ownership
    const follow = await db.follow.findUnique({
      where: { id: followId },
      include: {
        follower: {
          select: { name: true },
        },
      },
    });

    if (!follow) {
      return {
        success: false,
        error: "Follow relationship not found",
      };
    }

    // Check if user has permission to remove this follower
    if (follow.hostId !== session.user.id && session.user.role !== "ADMIN") {
      return {
        success: false,
        error: "You don't have permission to remove this follower",
      };
    }

    await db.follow.delete({
      where: { id: followId },
    });

    revalidatePath("/dashboard/followers");

    return {
      success: true,
      message: `Removed ${follow.follower.name} from your followers`,
    };
  } catch (error) {
    console.error("Error removing follower:", error);
    return {
      success: false,
      error: "Failed to remove follower",
    };
  }
}

export async function getFollowersCount(hostId: string) {
  try {
    const count = await db.follow.count({
      where: {
        hostId: hostId,
      },
    });

    return {
      success: true,
      data: { count },
    };
  } catch (error) {
    console.error("Error getting followers count:", error);
    return {
      success: false,
      error: "Failed to get followers count",
    };
  }
}
