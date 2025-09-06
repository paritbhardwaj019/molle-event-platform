"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Validation schema for creating/updating a perk
const exclusivePerkSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  isEnabled: z.boolean().default(true),
});

type ExclusivePerkFormData = z.infer<typeof exclusivePerkSchema>;

/**
 * Creates a new exclusive perk
 */
export async function createExclusivePerk(formData: ExclusivePerkFormData) {
  try {
    // For now we'll skip authentication check
    // In a real app, you would check if the user is an admin

    // Validate form data
    const validatedData = exclusivePerkSchema.parse(formData);

    // Create new perk using Prisma
    const perk = await db.exclusivePerk.create({
      data: {
        name: validatedData.name,
        description: validatedData.description || "",
        isEnabled: validatedData.isEnabled,
      },
    });

    revalidatePath("/dashboard/exclusive-perks");

    return {
      success: true,
      data: perk,
    };
  } catch (error) {
    console.error("Error creating exclusive perk:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || "Invalid form data",
      };
    }

    return {
      success: false,
      error: "Failed to create exclusive perk",
    };
  }
}

/**
 * Updates an existing exclusive perk
 */
export async function updateExclusivePerk(formData: ExclusivePerkFormData) {
  try {
    // For now we'll skip authentication check
    // In a real app, you would check if the user is an admin

    if (!formData.id) {
      return {
        success: false,
        error: "Perk ID is required",
      };
    }

    // Validate form data
    const validatedData = exclusivePerkSchema.parse(formData);

    // Update perk using Prisma
    const perk = await db.exclusivePerk.update({
      where: {
        id: formData.id,
      },
      data: {
        name: validatedData.name,
        description: validatedData.description || "",
        isEnabled: validatedData.isEnabled,
      },
    });

    revalidatePath("/dashboard/exclusive-perks");

    return {
      success: true,
      data: perk,
    };
  } catch (error) {
    console.error("Error updating exclusive perk:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || "Invalid form data",
      };
    }

    return {
      success: false,
      error: "Failed to update exclusive perk",
    };
  }
}

/**
 * Updates the enabled status of an exclusive perk
 */
export async function togglePerkStatus(id: string, isEnabled: boolean) {
  try {
    // For now we'll skip authentication check
    // In a real app, you would check if the user is an admin

    // Update perk status using Prisma
    const perk = await db.exclusivePerk.update({
      where: {
        id,
      },
      data: {
        isEnabled,
      },
    });

    revalidatePath("/dashboard/exclusive-perks");

    return {
      success: true,
      data: perk,
    };
  } catch (error) {
    console.error("Error toggling perk status:", error);
    return {
      success: false,
      error: "Failed to update perk status",
    };
  }
}

/**
 * Deletes an exclusive perk
 */
export async function deleteExclusivePerk(id: string) {
  try {
    // For now we'll skip authentication check
    // In a real app, you would check if the user is an admin

    // Delete perk using Prisma
    await db.exclusivePerk.delete({
      where: {
        id,
      },
    });

    revalidatePath("/dashboard/exclusive-perks");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting exclusive perk:", error);
    return {
      success: false,
      error: "Failed to delete exclusive perk",
    };
  }
}

/**
 * Get all exclusive perks
 */
export async function getAllExclusivePerks() {
  try {
    const perks = await db.exclusivePerk.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      data: perks,
    };
  } catch (error) {
    console.error("Error fetching exclusive perks:", error);
    return {
      success: false,
      error: "Failed to fetch exclusive perks",
    };
  }
}

/**
 * Get enabled exclusive perks
 */
export async function getEnabledExclusivePerks() {
  try {
    const perks = await db.exclusivePerk.findMany({
      where: {
        isEnabled: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      data: perks,
    };
  } catch (error) {
    console.error("Error fetching enabled perks:", error);
    return {
      success: false,
      error: "Failed to fetch enabled perks",
    };
  }
}
