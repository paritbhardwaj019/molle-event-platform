"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Validation schema for creating/updating an amenity
const amenitySchema = z.object({
  id: z.string().optional(),
  name: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name must be 50 characters or less"),
  description: z.string().optional(),
  icon: z.string().optional(),
  isEnabled: z.boolean().default(true),
});

export type AmenityFormData = z.infer<typeof amenitySchema>;

export type Amenity = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Creates a new amenity
 */
export async function createAmenity(formData: AmenityFormData) {
  try {
    // For now we'll skip authentication check
    // In a real app, you would check if the user is an admin

    // Validate form data
    const validatedData = amenitySchema.parse(formData);

    // Check if amenity with same name already exists
    const existingAmenity = await db.amenity.findFirst({
      where: {
        name: {
          equals: validatedData.name,
          mode: "insensitive",
        },
      },
    });

    if (existingAmenity) {
      return {
        success: false,
        error: "An amenity with this name already exists",
      };
    }

    // Create new amenity using Prisma
    const amenity = await db.amenity.create({
      data: {
        name: validatedData.name,
        description: validatedData.description || null,
        icon: validatedData.icon || null,
        isEnabled: validatedData.isEnabled,
      },
    });

    revalidatePath("/dashboard/admin/amenities");

    return {
      success: true,
      data: amenity,
    };
  } catch (error) {
    console.error("Error creating amenity:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || "Invalid form data",
      };
    }

    return {
      success: false,
      error: "Failed to create amenity",
    };
  }
}

/**
 * Updates an existing amenity
 */
export async function updateAmenity(formData: AmenityFormData) {
  try {
    // For now we'll skip authentication check
    // In a real app, you would check if the user is an admin

    if (!formData.id) {
      return {
        success: false,
        error: "Amenity ID is required",
      };
    }

    // Validate form data
    const validatedData = amenitySchema.parse(formData);

    // Check if another amenity with same name already exists (excluding current one)
    const existingAmenity = await db.amenity.findFirst({
      where: {
        name: {
          equals: validatedData.name,
          mode: "insensitive",
        },
        id: {
          not: formData.id,
        },
      },
    });

    if (existingAmenity) {
      return {
        success: false,
        error: "An amenity with this name already exists",
      };
    }

    // Update amenity using Prisma
    const amenity = await db.amenity.update({
      where: {
        id: formData.id,
      },
      data: {
        name: validatedData.name,
        description: validatedData.description || null,
        icon: validatedData.icon || null,
        isEnabled: validatedData.isEnabled,
      },
    });

    revalidatePath("/dashboard/admin/amenities");

    return {
      success: true,
      data: amenity,
    };
  } catch (error) {
    console.error("Error updating amenity:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || "Invalid form data",
      };
    }

    return {
      success: false,
      error: "Failed to update amenity",
    };
  }
}

/**
 * Updates the enabled status of an amenity
 */
export async function toggleAmenityStatus(id: string) {
  try {
    // For now we'll skip authentication check
    // In a real app, you would check if the user is an admin

    // Get current amenity to toggle status
    const currentAmenity = await db.amenity.findUnique({
      where: { id },
    });

    if (!currentAmenity) {
      return {
        success: false,
        error: "Amenity not found",
      };
    }

    // Update amenity status using Prisma
    const amenity = await db.amenity.update({
      where: {
        id,
      },
      data: {
        isEnabled: !currentAmenity.isEnabled,
      },
    });

    revalidatePath("/dashboard/admin/amenities");

    return {
      success: true,
      data: amenity,
    };
  } catch (error) {
    console.error("Error toggling amenity status:", error);
    return {
      success: false,
      error: "Failed to update amenity status",
    };
  }
}

/**
 * Deletes an amenity
 */
export async function deleteAmenity(id: string) {
  try {
    // For now we'll skip authentication check
    // In a real app, you would check if the user is an admin

    // Check if amenity is being used by any events
    const eventCount = await db.eventAmenity.count({
      where: {
        amenityId: id,
      },
    });

    if (eventCount > 0) {
      return {
        success: false,
        error: `Cannot delete amenity as it is being used by ${eventCount} event(s). Consider disabling it instead.`,
      };
    }

    // Delete amenity using Prisma
    await db.amenity.delete({
      where: {
        id,
      },
    });

    revalidatePath("/dashboard/admin/amenities");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting amenity:", error);
    return {
      success: false,
      error: "Failed to delete amenity",
    };
  }
}

/**
 * Get all amenities (admin view)
 */
export async function getAllAmenities() {
  try {
    const amenities = await db.amenity.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      data: amenities,
    };
  } catch (error) {
    console.error("Error fetching amenities:", error);
    return {
      success: false,
      error: "Failed to fetch amenities",
    };
  }
}

/**
 * Get enabled amenities (for host/public use)
 */
export async function getEnabledAmenities() {
  try {
    const amenities = await db.amenity.findMany({
      where: {
        isEnabled: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return {
      success: true,
      data: amenities,
    };
  } catch (error) {
    console.error("Error fetching enabled amenities:", error);
    return {
      success: false,
      error: "Failed to fetch amenities",
    };
  }
}
