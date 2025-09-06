"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createCitySchema = z.object({
  name: z.string().min(1, "City name is required"),
  state: z.string().min(1, "State is required"),
});

export type City = {
  id: string;
  name: string;
  state: string;
  isActive: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
};

export async function getAllCities() {
  try {
    const cities = await db.city.findMany({
      orderBy: [
        { priority: "desc" }, // Popular cities first
        { state: "asc" },
        { name: "asc" },
      ],
    });

    return {
      success: true,
      data: cities,
    };
  } catch (error) {
    console.error("Error fetching cities:", error);
    return {
      success: false,
      error: "Failed to fetch cities",
    };
  }
}

export async function getActiveCities() {
  try {
    const cities = await db.city.findMany({
      where: {
        isActive: true,
      },
      orderBy: [
        { priority: "desc" }, // Popular cities first
        { state: "asc" },
        { name: "asc" },
      ],
    });

    return {
      success: true,
      data: cities,
    };
  } catch (error) {
    console.error("Error fetching active cities:", error);
    return {
      success: false,
      error: "Failed to fetch active cities",
    };
  }
}

export async function createCity(data: z.infer<typeof createCitySchema>) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized - Admin access required",
      };
    }

    const validatedData = createCitySchema.parse(data);

    const city = await db.city.create({
      data: validatedData,
    });

    revalidatePath("/dashboard/cities");

    return {
      success: true,
      data: city,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
      };
    }

    console.error("Error creating city:", error);
    return {
      success: false,
      error: "Failed to create city",
    };
  }
}

export async function updateCityStatus(cityId: string, isActive: boolean) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized - Admin access required",
      };
    }

    const city = await db.city.update({
      where: { id: cityId },
      data: { isActive },
    });

    revalidatePath("/dashboard/cities");

    return {
      success: true,
      data: city,
    };
  } catch (error) {
    console.error("Error updating city status:", error);
    return {
      success: false,
      error: "Failed to update city status",
    };
  }
}

export async function deleteCity(cityId: string) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized - Admin access required",
      };
    }

    await db.city.delete({
      where: { id: cityId },
    });

    revalidatePath("/dashboard/cities");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting city:", error);
    return {
      success: false,
      error: "Failed to delete city",
    };
  }
}

export async function updateCityPriority(cityId: string, priority: number) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized - Admin access required",
      };
    }

    const city = await db.city.update({
      where: { id: cityId },
      data: { priority },
    });

    revalidatePath("/dashboard/cities");

    return {
      success: true,
      data: city,
    };
  } catch (error) {
    console.error("Error updating city priority:", error);
    return {
      success: false,
      error: "Failed to update city priority",
    };
  }
}

export async function setPopularCities() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized - Admin access required",
      };
    }

    // Define popular Indian cities with their priorities
    const popularCities = [
      { name: "Mumbai", state: "Maharashtra", priority: 100 },
      { name: "Delhi", state: "Delhi", priority: 99 },
      { name: "Bangalore", state: "Karnataka", priority: 98 },
      { name: "Chennai", state: "Tamil Nadu", priority: 97 },
      { name: "Kolkata", state: "West Bengal", priority: 96 },
      { name: "Hyderabad", state: "Telangana", priority: 95 },
      { name: "Pune", state: "Maharashtra", priority: 94 },
      { name: "Ahmedabad", state: "Gujarat", priority: 93 },
      { name: "Jaipur", state: "Rajasthan", priority: 92 },
      { name: "Surat", state: "Gujarat", priority: 91 },
      { name: "Lucknow", state: "Uttar Pradesh", priority: 90 },
      { name: "Kanpur", state: "Uttar Pradesh", priority: 89 },
      { name: "Nagpur", state: "Maharashtra", priority: 88 },
      { name: "Indore", state: "Madhya Pradesh", priority: 87 },
      { name: "Thane", state: "Maharashtra", priority: 86 },
      { name: "Bhopal", state: "Madhya Pradesh", priority: 85 },
      { name: "Visakhapatnam", state: "Andhra Pradesh", priority: 84 },
      { name: "Pimpri-Chinchwad", state: "Maharashtra", priority: 83 },
      { name: "Patna", state: "Bihar", priority: 82 },
      { name: "Vadodara", state: "Gujarat", priority: 81 },
    ];

    // Update priorities for existing cities
    for (const cityData of popularCities) {
      await db.city.updateMany({
        where: {
          name: cityData.name,
          state: cityData.state,
        },
        data: {
          priority: cityData.priority,
        },
      });
    }

    revalidatePath("/dashboard/cities");

    return {
      success: true,
      message: "Popular cities priority updated successfully",
    };
  } catch (error) {
    console.error("Error setting popular cities:", error);
    return {
      success: false,
      error: "Failed to set popular cities",
    };
  }
}
