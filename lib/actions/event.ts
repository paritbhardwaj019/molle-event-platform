"use server";

import { db } from "@/lib/db";
import { eventSchema, type EventFormData } from "@/lib/validations/event";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { EventStatus, EventType, Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import slugify from "slugify";

export async function suggestSlug(title: string): Promise<string> {
  if (!title) return "";

  const slug = slugify(title, {
    lower: true,
    strict: true,
    trim: true,
    locale: "en",
  });

  return slug;
}

export async function createEvent(data: EventFormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to create an event",
      };
    }

    const validatedData = eventSchema.parse(data);

    const amenityOperations = await Promise.all(
      validatedData.amenities.map(async (amenityName) => {
        const existingAmenity = await db.amenity.findFirst({
          where: { name: amenityName },
        });

        if (existingAmenity) {
          return existingAmenity.id;
        }

        const newAmenity = await db.amenity.create({
          data: {
            name: amenityName,
          },
        });

        return newAmenity.id;
      })
    );

    const event = await db.event.create({
      data: {
        title: validatedData.title,
        description: validatedData.description || "",
        coverImage: validatedData.coverImage as string,
        slug: validatedData.slug,
        eventType:
          validatedData.eventType === "normal"
            ? EventType.NORMAL
            : EventType.INVITE_ONLY,
        status:
          validatedData.status === "draft"
            ? EventStatus.DRAFT
            : validatedData.status === "published"
            ? EventStatus.PUBLISHED
            : EventStatus.CANCELLED,
        minAge: validatedData.ageLimits?.min,
        maxAge: validatedData.ageLimits?.max,
        maxTickets: validatedData.totalCapacity,
        organizerName: validatedData.organizerName,
        organizerBio: validatedData.organizerBio,
        startDate: validatedData.startDate,
        endDate: validatedData.endDate,
        enableReferrers: validatedData.settings?.allowReferrals ?? false,
        host: {
          connect: {
            id: session.user.id,
          },
        },
        amenities: {
          create: amenityOperations.map((amenityId) => ({
            amenity: {
              connect: {
                id: amenityId,
              },
            },
          })),
        },
        packages: {
          create: validatedData.packages.map((pkg) => ({
            name: pkg.name,
            description: pkg.description,
            price: pkg.price,
            maxTickets: pkg.maxTicketsPerBooking,
            benefits: pkg.includedItems,
          })),
        },
      },
      include: {
        amenities: {
          include: {
            amenity: true,
          },
        },
        packages: true,
      },
    });

    revalidatePath("/events");
    return { success: true, data: event };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map((e) => e.message).join(", "),
      };
    }
    return { success: false, error: "Something went wrong" };
  }
}

export async function getAllEvents({
  isFeatured,
}: {
  isFeatured?: boolean;
} = {}) {
  try {
    const events = await db.event.findMany({
      include: {
        amenities: {
          include: {
            amenity: true,
          },
        },
        packages: true,
        bookings: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      where: {
        ...(isFeatured ? { isFeatured: true } : {}),
      },
    });

    return {
      success: true,
      data: events,
    };
  } catch (error) {
    return {
      success: false,
      error: "Failed to fetch events",
    };
  }
}

export async function deleteEvent(eventId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to delete an event",
      };
    }

    // First check if the event exists and belongs to the user
    const event = await db.event.findFirst({
      where: {
        id: eventId,
        hostId: session.user.id,
      },
    });

    if (!event) {
      return {
        success: false,
        error: "Event not found or you don't have permission to delete it",
      };
    }

    // Delete the event and all related data
    await db.event.delete({
      where: {
        id: eventId,
      },
    });

    revalidatePath("/events");
    return { success: true };
  } catch (error) {
    console.error("Error deleting event:", error);
    return { success: false, error: "Failed to delete event" };
  }
}

export async function getEventBySlug(slug: string) {
  try {
    const event = await db.event.findUnique({
      where: {
        slug,
      },
      include: {
        host: true,
        amenities: {
          include: {
            amenity: true,
          },
        },
        packages: true,
        bookings: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!event) {
      return {
        success: false,
        error: "Event not found",
      };
    }

    const serializedEvent = {
      ...event,
      packages: event.packages.map((pkg) => ({
        ...pkg,
        price:
          pkg.price instanceof Prisma.Decimal ? Number(pkg.price) : pkg.price,
      })),
      host: {
        ...event.host,
        walletBalance:
          event.host.walletBalance instanceof Prisma.Decimal
            ? Number(event.host.walletBalance)
            : event.host.walletBalance,
      },
    };

    return {
      success: true,
      data: serializedEvent,
    };
  } catch (error) {
    console.error("Error fetching event:", error);
    return {
      success: false,
      error: "Failed to fetch event details",
    };
  }
}

export async function getEventsForDropdown(filterEnabled = false) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to view events",
      };
    }

    const events = await db.event.findMany({
      where: {
        status: {
          in: [EventStatus.PUBLISHED, EventStatus.DRAFT],
        },
        ...(filterEnabled ? { enableReferrers: true } : {}),
      },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        enableReferrers: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      data: events,
    };
  } catch (error) {
    console.error("Error fetching events for dropdown:", error);
    return {
      success: false,
      error: "Failed to fetch events",
    };
  }
}

export async function getEventPackages(eventId: string) {
  try {
    const packages = await db.package.findMany({
      where: {
        eventId,
      },
      orderBy: {
        price: "asc",
      },
    });

    // Convert Decimal values to numbers
    const serializedPackages = packages.map((pkg) => ({
      ...pkg,
      price:
        pkg.price instanceof Prisma.Decimal ? Number(pkg.price) : pkg.price,
    }));

    return {
      success: true,
      data: serializedPackages,
    };
  } catch (error) {
    console.error("Error fetching event packages:", error);
    return {
      success: false,
      error: "Failed to fetch packages",
    };
  }
}

export async function updateEventFeaturedStatus(
  eventId: string,
  isFeatured: boolean
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to update event status",
      };
    }

    // Check if user is admin
    const user = await db.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || user.role !== "ADMIN") {
      return {
        success: false,
        error: "Only admins can update featured status",
      };
    }

    const event = await db.event.update({
      where: { id: eventId },
      data: { isFeatured },
    });

    revalidatePath("/events");
    return { success: true, data: event };
  } catch (error) {
    console.error("Error updating event featured status:", error);
    return { success: false, error: "Failed to update featured status" };
  }
}
