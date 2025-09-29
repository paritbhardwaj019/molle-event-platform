"use server";

import { db } from "@/lib/db";
import {
  eventSchema,
  type EventFormData,
  eventUpdateSchema,
  type EventUpdateData,
} from "@/lib/validations/event";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { EventStatus, EventType, Prisma, TicketStatus } from "@prisma/client";
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

    // Check if user is HOST and has approved KYC
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        kycRequests: {
          where: {
            status: "APPROVED",
          },
          take: 1,
        },
      },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    if (user.role !== "HOST") {
      return {
        success: false,
        error: "Only hosts can create events",
      };
    }

    const hasApprovedKyc = user.kycRequests.length > 0;
    if (!hasApprovedKyc) {
      return {
        success: false,
        error:
          "KYC verification required. Please complete your KYC to create events.",
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

    const eventData: any = {
      title: validatedData.title,
      description: validatedData.description || "",
      coverImage:
        validatedData.images?.[0]?.secureUrl || validatedData.coverImage || "",
      slug: validatedData.slug,
      isExclusive: validatedData.isExclusive || false,
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
      location: validatedData.location,
      city: validatedData.city,
      landmark: validatedData.landmark,
      streetAddress: validatedData.streetAddress,
      startDate: validatedData.startDate,
      endDate: validatedData.endDate,
      enableReferrers: validatedData.settings?.allowReferrals ?? false,
      referralPercentage: validatedData.settings?.referralPercentage ?? 5,
      host: {
        connect: {
          id: session.user.id,
        },
      },
      images: {
        create:
          validatedData.images?.map((img, index) => ({
            publicId: img.publicId,
            secureUrl: img.secureUrl,
            width: img.width,
            height: img.height,
            bytes: img.bytes,
            format: img.format,
            uploadedAt: img.uploadedAt,
            order: img.order || index,
          })) || [],
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
          allocation: pkg.allocation,
          benefits: pkg.includedItems,
        })),
      },
    };

    // Add inviteForm relation if inviteFormId is provided
    if (validatedData.settings?.inviteFormId) {
      eventData.inviteForm = {
        connect: {
          id: validatedData.settings.inviteFormId,
        },
      };
    }

    const event = await db.event.create({
      data: eventData,
      include: {
        images: {
          orderBy: {
            order: "asc",
          },
        },
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
  city,
}: {
  isFeatured?: boolean;
  city?: string;
} = {}) {
  try {
    const session = await auth();

    // If no session, return public events only
    if (!session?.user?.id) {
      const events = await db.event.findMany({
        where: {
          status: EventStatus.PUBLISHED,
          endDate: {
            gt: new Date(), // Only show events that haven't ended
          },
          ...(isFeatured ? { isFeatured: true } : {}),
          ...(city ? { city: { equals: city, mode: "insensitive" } } : {}),
        },
        include: {
          images: {
            orderBy: {
              order: "asc",
            },
          },
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
      });

      return {
        success: true,
        data: events,
      };
    }

    // Get user details to check role and KYC status
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        kycRequests: {
          where: {
            status: "APPROVED",
          },
          take: 1,
        },
      },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    let whereClause: any = {
      ...(isFeatured ? { isFeatured: true } : {}),
      ...(city ? { city: { equals: city, mode: "insensitive" } } : {}),
    };

    // Admin can see all events
    if (user.role === "ADMIN") {
      // No additional restrictions for admin
    }
    // Host can only see their own events and only if KYC is approved
    else if (user.role === "HOST") {
      const hasApprovedKyc = user.kycRequests.length > 0;

      if (!hasApprovedKyc) {
        return {
          success: false,
          error:
            "KYC verification required. Please complete your KYC to access events.",
        };
      }

      whereClause.hostId = session.user.id;
    }
    // Regular users and referrers can only see published events
    else {
      whereClause.status = EventStatus.PUBLISHED;
      whereClause.endDate = {
        gt: new Date(), // Only show events that haven't ended
      };
    }

    const events = await db.event.findMany({
      where: whereClause,
      include: {
        images: {
          orderBy: {
            order: "asc",
          },
        },
        amenities: {
          include: {
            amenity: true,
          },
        },
        packages: true,
        bookings: true,
        reviews: {
          select: {
            rating: true,
          },
        },
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
    console.error("Error fetching events:", error);
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

    // Check if user is HOST and has approved KYC
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        kycRequests: {
          where: {
            status: "APPROVED",
          },
          take: 1,
        },
      },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Admins can delete any event
    if (user.role === "ADMIN") {
      await db.event.delete({
        where: { id: eventId },
      });

      revalidatePath("/events");
      return { success: true };
    }

    // Hosts can delete only their own events with approved KYC
    if (user.role !== "HOST") {
      return {
        success: false,
        error: "Only hosts or admins can delete events",
      };
    }

    const hasApprovedKyc = user.kycRequests.length > 0;
    if (!hasApprovedKyc) {
      return {
        success: false,
        error:
          "KYC verification required. Please complete your KYC to delete events.",
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
    const session = await auth();

    // Build where clause based on user role and authentication
    let whereClause: any = {
      slug,
    };

    // If no session, only show published events
    if (!session?.user?.id) {
      whereClause.status = EventStatus.PUBLISHED;
    } else {
      // Get user details to check role
      const user = await db.user.findUnique({
        where: { id: session.user.id },
        include: {
          kycRequests: {
            where: {
              status: "APPROVED",
            },
            take: 1,
          },
        },
      });

      if (!user) {
        whereClause.status = EventStatus.PUBLISHED;
      } else {
        // Admin can see all events
        if (user.role === "ADMIN") {
          // No additional restrictions for admin
        }
        // Host can only see their own events (including drafts) and only if KYC is approved
        else if (user.role === "HOST") {
          const hasApprovedKyc = user.kycRequests.length > 0;
          if (!hasApprovedKyc) {
            whereClause.status = EventStatus.PUBLISHED;
          } else {
            whereClause.hostId = session.user.id;
          }
        }
        // Regular users and referrers can only see published events
        else {
          whereClause.status = EventStatus.PUBLISHED;
        }
      }
    }

    const event = await db.event.findFirst({
      where: whereClause,
      include: {
        images: {
          orderBy: {
            order: "asc",
          },
        },
        host: {
          include: {
            kycRequests: {
              where: {
                status: "APPROVED",
              },
              take: 1,
              orderBy: {
                createdAt: "desc",
              },
            },
          },
        },
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

    // Get user details to check role and KYC status
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        kycRequests: {
          where: {
            status: "APPROVED",
          },
          take: 1,
        },
      },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    let whereClause: any = {
      status: {
        in: [EventStatus.PUBLISHED, EventStatus.DRAFT],
      },
      ...(filterEnabled ? { enableReferrers: true } : {}),
    };

    // Admin can see all events
    if (user.role === "ADMIN") {
      // No additional restrictions for admin
    }
    // Host can only see their own events and only if KYC is approved
    else if (user.role === "HOST") {
      const hasApprovedKyc = user.kycRequests.length > 0;

      if (!hasApprovedKyc) {
        return {
          success: false,
          error:
            "KYC verification required. Please complete your KYC to access events.",
        };
      }

      whereClause.hostId = session.user.id;
    }
    // Referrers can see all published events (for creating referral links)
    else if (user.role === "REFERRER") {
      whereClause.status = EventStatus.PUBLISHED;
    }
    // Regular users can only see published events
    else {
      whereClause.status = EventStatus.PUBLISHED;
    }

    const events = await db.event.findMany({
      where: whereClause,
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
      include: {
        _count: {
          select: {
            tickets: {
              where: {
                status: {
                  not: "CANCELLED",
                },
              },
            },
          },
        },
      },
      orderBy: {
        price: "asc",
      },
    });

    // Convert Decimal values to numbers and add availability info
    const serializedPackages = packages.map((pkg) => {
      const soldTickets = pkg._count.tickets;
      const allocation = pkg.allocation || 0;
      const isFullHouse = allocation > 0 && soldTickets >= allocation;
      const remainingTickets =
        allocation > 0 ? Math.max(0, allocation - soldTickets) : 999;

      return {
        ...pkg,
        price:
          pkg.price instanceof Prisma.Decimal ? Number(pkg.price) : pkg.price,
        soldTickets,
        isFullHouse,
        remainingTickets,
        _count: undefined, // Remove the _count from the response
      };
    });

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

export async function updateEvent(eventId: string, data: EventUpdateData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to update an event",
      };
    }

    // Check if user is HOST and has approved KYC
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        kycRequests: {
          where: {
            status: "APPROVED",
          },
          take: 1,
        },
      },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    if (user.role === "HOST") {
      const hasApprovedKyc = user.kycRequests.some(
        (kyc) => kyc.status === "APPROVED"
      );
      if (!hasApprovedKyc) {
        return {
          success: false,
          error:
            "KYC verification required. Please complete your KYC to update events.",
        };
      }
    }

    const existingEvent = await db.event.findFirst({
      where: {
        id: eventId,
        ...(user.role === "HOST" && {
          hostId: session.user.id,
        }),
      },
    });

    if (!existingEvent) {
      return {
        success: false,
        error: "Event not found or you don't have permission to update it",
      };
    }

    const validatedData = eventUpdateSchema.parse(data);

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

    const eventData: any = {
      title: validatedData.title,
      description: validatedData.description || "",
      coverImage:
        validatedData.images?.[0]?.secureUrl || validatedData.coverImage || "",
      slug: validatedData.slug,
      isExclusive: validatedData.isExclusive || false,
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
      location: validatedData.location,
      city: validatedData.city,
      landmark: validatedData.landmark,
      streetAddress: validatedData.streetAddress,
      startDate: validatedData.startDate,
      endDate: validatedData.endDate,
      enableReferrers: validatedData.settings?.allowReferrals ?? false,
      referralPercentage: validatedData.settings?.referralPercentage ?? 5,
    };

    if (validatedData.settings?.inviteFormId) {
      eventData.inviteForm = {
        connect: {
          id: validatedData.settings.inviteFormId,
        },
      };
    } else {
      eventData.inviteForm = {
        disconnect: true,
      };
    }

    // Update the event
    const updatedEvent = await db.event.update({
      where: { id: eventId },
      data: eventData,
      include: {
        images: {
          orderBy: {
            order: "asc",
          },
        },
        amenities: {
          include: {
            amenity: true,
          },
        },
        packages: true,
      },
    });

    // Delete existing amenities
    await db.eventAmenity.deleteMany({
      where: { eventId },
    });

    // Recreate amenities
    await db.eventAmenity.createMany({
      data: amenityOperations.map((amenityId) => ({
        eventId,
        amenityId,
      })),
    });

    // Handle packages more carefully to preserve existing packages
    const existingPackages = await db.package.findMany({
      where: { eventId },
      include: {
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    });

    // Create a map of existing packages by name for easy lookup
    const existingPackageMap = new Map(
      existingPackages.map((pkg) => [pkg.name, pkg])
    );

    // Process each package from the form data
    for (const newPkg of validatedData.packages) {
      const existingPkg = existingPackageMap.get(newPkg.name);

      if (existingPkg) {
        // Update existing package
        await db.package.update({
          where: { id: existingPkg.id },
          data: {
            description: newPkg.description,
            price: newPkg.price,
            maxTickets: newPkg.maxTicketsPerBooking,
            allocation: newPkg.allocation,
            benefits: newPkg.includedItems,
          },
        });
      } else {
        // Create new package
        await db.package.create({
          data: {
            eventId,
            name: newPkg.name,
            description: newPkg.description,
            price: newPkg.price,
            maxTickets: newPkg.maxTicketsPerBooking,
            allocation: newPkg.allocation,
            benefits: newPkg.includedItems,
          },
        });
      }
    }

    // Find packages that are no longer in the form data and delete them
    // Only delete packages that don't have any bookings to avoid data loss
    const formPackageNames = new Set(
      validatedData.packages.map((pkg) => pkg.name)
    );
    const packagesToDelete = existingPackages.filter(
      (pkg) => !formPackageNames.has(pkg.name) && pkg._count.bookings === 0
    );

    if (packagesToDelete.length > 0) {
      await db.package.deleteMany({
        where: {
          id: {
            in: packagesToDelete.map((pkg) => pkg.id),
          },
        },
      });
    }

    // Delete existing images and recreate them
    await db.eventImage.deleteMany({
      where: { eventId },
    });

    // Only create new images if they exist
    if (validatedData.images && validatedData.images.length > 0) {
      await db.eventImage.createMany({
        data: validatedData.images.map((img, index) => ({
          eventId,
          publicId: img.publicId,
          secureUrl: img.secureUrl,
          width: img.width,
          height: img.height,
          bytes: img.bytes,
          format: img.format,
          uploadedAt: img.uploadedAt,
          order: img.order || index,
        })),
      });
    }

    revalidatePath("/events");
    revalidatePath(`/events/${updatedEvent.slug}`);
    return { success: true, data: updatedEvent };
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

export async function getEventById(eventId: string) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to view event details",
      };
    }

    const event = await db.event.findFirst({
      where: {
        id: eventId,
        ...(session.user.role === "HOST" && {
          hostId: session.user.id,
        }),
      },
      include: {
        images: {
          orderBy: {
            order: "asc",
          },
        },
        amenities: {
          include: {
            amenity: true,
          },
        },
        packages: true,
        inviteForm: true,
      },
    });

    if (!event) {
      return {
        success: false,
        error: "Event not found or you don't have permission to view it",
      };
    }

    // Transform the event data to match the form structure
    const transformedEvent: EventFormData = {
      title: event.title,
      description: event.description || "",
      coverImage: event.coverImage,
      images: event.images.map((img) => ({
        publicId: img.publicId,
        secureUrl: img.secureUrl,
        width: img.width,
        height: img.height,
        bytes: img.bytes,
        format: img.format,
        uploadedAt: img.uploadedAt,
        order: img.order,
      })),
      slug: event.slug,
      eventType: event.eventType === "NORMAL" ? "normal" : "invite_only",
      status:
        event.status === "DRAFT"
          ? "draft"
          : event.status === "PUBLISHED"
            ? "published"
            : "cancelled",
      isExclusive: event.isExclusive,
      location: event.location,
      city: event.city || "",
      landmark: event.landmark || "",
      streetAddress: event.streetAddress || "",
      ageLimits: {
        min: event.minAge || undefined,
        max: event.maxAge || undefined,
        note: "",
      },
      totalCapacity: event.maxTickets,
      maxTicketsPerUser: undefined,
      organizerName: event.organizerName,
      organizerBio: event.organizerBio || "",
      startDate: event.startDate,
      endDate: event.endDate,
      settings: {
        allowReferrals: event.enableReferrers,
        autoApproveInvites: false,
        referralPercentage: Number(event.referralPercentage),
        inviteFormId: event.inviteFormId || "",
      },
      amenities: event.amenities.map((ea) => ea.amenity.name),
      packages: event.packages.map((pkg) => ({
        name: pkg.name,
        description: pkg.description || "",
        price: Number(pkg.price),
        maxTicketsPerBooking: pkg.maxTickets || 1, // Provide default value if null
        allocation: pkg.allocation || 1, // Provide default value if null
        includedItems: pkg.benefits,
      })),
    };

    return {
      success: true,
      data: transformedEvent,
    };
  } catch (error) {
    console.error("Error fetching event:", error);
    return {
      success: false,
      error: "Failed to fetch event details",
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

export async function searchEvents(query: string) {
  try {
    if (!query || query.trim().length === 0) {
      return { success: true, data: [] };
    }

    const session = await auth();
    const searchTerm = query.trim().toLowerCase();

    // Base where clause for search
    let whereClause: any = {
      OR: [
        {
          title: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
        {
          organizerName: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
        {
          location: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
      ],
    };

    // If no session, only show published events
    if (!session?.user?.id) {
      whereClause.status = EventStatus.PUBLISHED;
      whereClause.endDate = {
        gt: new Date(), // Only show events that haven't ended
      };
    } else {
      // Get user details to check role and KYC status
      const user = await db.user.findUnique({
        where: { id: session.user.id },
        include: {
          kycRequests: {
            where: {
              status: "APPROVED",
            },
            take: 1,
          },
        },
      });

      if (!user) {
        whereClause.status = EventStatus.PUBLISHED;
      } else {
        // Admin can see all events
        if (user.role === "ADMIN") {
          // No additional restrictions for admin
        }
        // Host can only see their own events and only if KYC is approved
        else if (user.role === "HOST") {
          const hasApprovedKyc = user.kycRequests.length > 0;

          if (!hasApprovedKyc) {
            return {
              success: false,
              error:
                "KYC verification required. Please complete your KYC to search events.",
            };
          }

          whereClause.hostId = session.user.id;
        }
        // Regular users and referrers can only see published events
        else {
          whereClause.status = EventStatus.PUBLISHED;
          whereClause.endDate = {
            gt: new Date(), // Only show events that haven't ended
          };
        }
      }
    }

    const events = await db.event.findMany({
      where: whereClause,
      include: {
        amenities: {
          include: {
            amenity: true,
          },
        },
        packages: {
          orderBy: {
            price: "asc",
          },
          take: 1,
        },
        bookings: true,
        host: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: [
        {
          isFeatured: "desc",
        },
        {
          startDate: "asc",
        },
      ],
      take: 20, // Limit results for performance
    });

    // Serialize the events for client consumption
    const serializedEvents = events.map((event) => ({
      ...event,
      packages: event.packages.map((pkg) => ({
        ...pkg,
        price:
          pkg.price instanceof Prisma.Decimal ? Number(pkg.price) : pkg.price,
      })),
    }));

    return {
      success: true,
      data: serializedEvents,
    };
  } catch (error) {
    console.error("Error searching events:", error);
    return {
      success: false,
      error: "Failed to search events",
    };
  }
}

export async function hasUserPurchasedEventTickets(
  eventId: string,
  userId: string
) {
  try {
    const ticket = await db.ticket.findFirst({
      where: {
        userId: userId,
        eventId: eventId,
      },
    });

    return {
      success: true,
      data: {
        hasPurchased: !!ticket,
        ticket: ticket,
      },
    };
  } catch (error) {
    console.error("Error checking user ticket purchase:", error);
    return {
      success: false,
      error: "Failed to check ticket purchase status",
    };
  }
}

/**
 * Updates event statuses based on current conditions (expired events and sold out events)
 * This function should be called periodically or when events are fetched
 */
export async function updateEventStatuses() {
  try {
    const now = new Date();

    // Get all events that need status updates
    const eventsToUpdate = await db.event.findMany({
      where: {
        OR: [
          // Events that have ended but are not marked as expired
          {
            endDate: {
              lt: now,
            },
            status: {
              notIn: [
                EventStatus.EXPIRED,
                EventStatus.CANCELLED,
                EventStatus.COMPLETED,
              ],
            },
          },
        ],
      },
      select: {
        id: true,
        status: true,
        startDate: true,
        endDate: true,
        maxTickets: true,
        soldTickets: true,
      },
    });

    const potentialFullHouseEvents = await db.event.findMany({
      where: {
        status: {
          notIn: [
            EventStatus.FULL_HOUSE,
            EventStatus.CANCELLED,
            EventStatus.COMPLETED,
            EventStatus.EXPIRED,
          ],
        },
      },
      select: {
        id: true,
        status: true,
        startDate: true,
        endDate: true,
        maxTickets: true,
        soldTickets: true,
      },
    });

    // Combine both arrays and remove duplicates
    const allEventsToCheck = [...eventsToUpdate];
    potentialFullHouseEvents.forEach((event) => {
      if (!allEventsToCheck.find((e) => e.id === event.id)) {
        allEventsToCheck.push(event);
      }
    });

    const updatePromises = allEventsToCheck.map(async (event) => {
      let newStatus = event.status;

      // Check if event has expired
      if (event.endDate < now) {
        newStatus = EventStatus.EXPIRED;
      }
      // Check if event is sold out (but not expired)
      else if (event.soldTickets >= event.maxTickets) {
        newStatus = EventStatus.FULL_HOUSE;
      }

      // Only update if status has changed
      if (newStatus !== event.status) {
        return db.event.update({
          where: { id: event.id },
          data: { status: newStatus },
        });
      }

      return null;
    });

    const results = await Promise.all(updatePromises);
    const updatedEvents = results.filter(Boolean);

    return {
      success: true,
      data: {
        updatedCount: updatedEvents.length,
        events: updatedEvents,
      },
    };
  } catch (error) {
    console.error("Error updating event statuses:", error);
    return {
      success: false,
      error: "Failed to update event statuses",
    };
  }
}

/**
 * Gets the calculated status for a specific event
 * @param eventId - The ID of the event
 * @returns The calculated event status
 */
export async function getCalculatedEventStatus(eventId: string) {
  try {
    const event = await db.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        status: true,
        startDate: true,
        endDate: true,
        maxTickets: true,
        soldTickets: true,
      },
    });

    if (!event) {
      return {
        success: false,
        error: "Event not found",
      };
    }

    const { calculateEventStatus } = await import("@/lib/event-status");
    const calculatedStatus = calculateEventStatus(event);

    return {
      success: true,
      data: {
        currentStatus: event.status,
        calculatedStatus,
        shouldUpdate: calculatedStatus !== event.status,
      },
    };
  } catch (error) {
    console.error("Error calculating event status:", error);
    return {
      success: false,
      error: "Failed to calculate event status",
    };
  }
}
