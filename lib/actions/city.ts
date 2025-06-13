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
  createdAt: Date;
  updatedAt: Date;
};

export async function getAllCities() {
  try {
    const cities = await db.city.findMany({
      orderBy: [{ state: "asc" }, { name: "asc" }],
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
      orderBy: [{ state: "asc" }, { name: "asc" }],
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
