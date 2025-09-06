"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().max(200).optional(),
  media: z
    .array(
      z.object({
        publicId: z.string(),
        secureUrl: z.string(),
        width: z.number(),
        height: z.number(),
        bytes: z.number(),
        format: z.string(),
        uploadedAt: z.string(),
        type: z.enum(["image"]), // Only images allowed
        order: z.number().optional(),
      })
    )
    .max(3)
    .optional(),
  eventId: z.string(),
});

export type Review = {
  id: string;
  rating: number;
  comment: string | null;
  media: Array<{
    publicId: string;
    secureUrl: string;
    width: number;
    height: number;
    bytes: number;
    format: string;
    uploadedAt: string;
    type: "image"; // Only images allowed
    order?: number;
  }> | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    avatar: string | null;
  };
  event: {
    id: string;
    title: string;
    slug?: string;
    host?: {
      id: string;
      name: string;
    };
  };
};

export async function createReview({
  rating,
  comment,
  media,
  eventId,
}: {
  rating: number;
  comment?: string;
  media?: Array<{
    publicId: string;
    secureUrl: string;
    width: number;
    height: number;
    bytes: number;
    format: string;
    uploadedAt: string;
    type: "image"; // Only images allowed
    order?: number;
  }>;
  eventId: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to leave a review",
      };
    }

    // Validate input
    const validatedData = reviewSchema.parse({
      rating,
      comment: comment?.trim() || undefined,
      media,
      eventId,
    });

    // Check if event exists
    const event = await db.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return {
        success: false,
        error: "Event not found",
      };
    }

    // Check if user has already reviewed this event
    const existingReview = await db.review.findUnique({
      where: {
        userId_eventId: {
          userId: session.user.id,
          eventId,
        },
      },
    });

    if (existingReview) {
      return {
        success: false,
        error: "You have already reviewed this event",
      };
    }

    // Create the review
    const review = await db.review.create({
      data: {
        rating: validatedData.rating,
        comment: validatedData.comment,
        media: validatedData.media
          ? JSON.parse(JSON.stringify(validatedData.media))
          : null,
        userId: session.user.id,
        eventId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    revalidatePath(`/events/${event.slug}`);
    revalidatePath("/dashboard/events");

    return {
      success: true,
      data: {
        ...review,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || "Invalid input",
      };
    }

    console.error("Error creating review:", error);
    return {
      success: false,
      error: "Failed to create review",
    };
  }
}

export async function getEventReviews(eventId: string) {
  try {
    const reviews = await db.review.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      data: reviews.map((review) => ({
        ...review,
        media: review.media as any,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
      })),
    };
  } catch (error) {
    console.error("Error fetching event reviews:", error);
    return {
      success: false,
      error: "Failed to fetch reviews",
    };
  }
}

export async function getEventReviewStats(eventId: string) {
  try {
    const stats = await db.review.aggregate({
      where: { eventId },
      _avg: {
        rating: true,
      },
      _count: {
        id: true,
      },
    });

    const ratingDistribution = await db.review.groupBy({
      by: ["rating"],
      where: { eventId },
      _count: {
        rating: true,
      },
    });

    return {
      success: true,
      data: {
        averageRating: stats._avg.rating || 0,
        totalReviews: stats._count.id || 0,
        ratingDistribution: ratingDistribution.reduce(
          (acc, curr) => {
            acc[curr.rating] = curr._count.rating;
            return acc;
          },
          {} as Record<number, number>
        ),
      },
    };
  } catch (error) {
    console.error("Error fetching event review stats:", error);
    return {
      success: false,
      error: "Failed to fetch review stats",
    };
  }
}

export async function getHostEventReviews(hostId?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in",
      };
    }

    // If hostId is provided, use it; otherwise use the current user's ID
    const targetHostId = hostId || session.user.id;

    // Check if the current user can view these reviews
    if (session.user.role !== "ADMIN" && session.user.id !== targetHostId) {
      return {
        success: false,
        error: "You don't have permission to view these reviews",
      };
    }

    const reviews = await db.review.findMany({
      where: {
        event: {
          hostId: targetHostId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      data: reviews.map((review) => ({
        ...review,
        media: review.media as any,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
      })),
    };
  } catch (error) {
    console.error("Error fetching host event reviews:", error);
    return {
      success: false,
      error: "Failed to fetch reviews",
    };
  }
}

export async function getUserReviewForEvent(eventId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in",
      };
    }

    const review = await db.review.findUnique({
      where: {
        userId_eventId: {
          userId: session.user.id,
          eventId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return {
      success: true,
      data: review
        ? {
            ...review,
            media: review.media as any,
            createdAt: review.createdAt,
            updatedAt: review.updatedAt,
          }
        : null,
    };
  } catch (error) {
    console.error("Error fetching user review:", error);
    return {
      success: false,
      error: "Failed to fetch review",
    };
  }
}

export async function canUserReviewEvent(eventId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: true,
        data: {
          canReview: false,
          reason: "You must be logged in to review events",
        },
      };
    }

    // Check if event exists
    const event = await db.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return {
        success: true,
        data: {
          canReview: false,
          reason: "Event not found",
        },
      };
    }

    // Check if user has already reviewed
    const existingReview = await db.review.findUnique({
      where: {
        userId_eventId: {
          userId: session.user.id,
          eventId,
        },
      },
    });

    if (existingReview) {
      return {
        success: true,
        data: {
          canReview: false,
          reason: "You have already reviewed this event",
        },
      };
    }

    return {
      success: true,
      data: { canReview: true, reason: null },
    };
  } catch (error) {
    console.error("Error checking review eligibility:", error);
    return {
      success: false,
      error: "Failed to check review eligibility",
    };
  }
}

export async function getAllReviews() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in",
      };
    }

    if (session.user.role !== "ADMIN") {
      return {
        success: false,
        error: "Only admins can view all reviews",
      };
    }

    const reviews = await db.review.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
            host: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      data: reviews.map((review) => ({
        ...review,
        media: review.media as any,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
      })),
    };
  } catch (error) {
    console.error("Error fetching all reviews:", error);
    return {
      success: false,
      error: "Failed to fetch reviews",
    };
  }
}

export async function deleteReview(reviewId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to delete a review",
      };
    }

    if (session.user.role !== "ADMIN") {
      return {
        success: false,
        error: "Only admins can delete reviews",
      };
    }

    const review = await db.review.findUnique({
      where: { id: reviewId },
      include: {
        event: {
          select: {
            slug: true,
          },
        },
      },
    });

    if (!review) {
      return {
        success: false,
        error: "Review not found",
      };
    }

    await db.review.delete({
      where: { id: reviewId },
    });

    revalidatePath("/dashboard/admin/reviews");
    revalidatePath(`/events/${review.event.slug}`);

    return { success: true };
  } catch (error) {
    console.error("Error deleting review:", error);
    return {
      success: false,
      error: "Failed to delete review",
    };
  }
}
