"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const eventRuleSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be less than 100 characters"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(1000, "Description must be less than 1000 characters"),
  isActive: z.boolean().default(true),
  order: z
    .number()
    .int()
    .min(0, "Order must be a non-negative integer")
    .default(0),
});

export type EventRule = {
  id: string;
  title: string;
  description: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
};

export async function getAllEventRules() {
  try {
    const eventRules = await db.eventRule.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });

    return { success: true, data: eventRules };
  } catch (error) {
    console.error("Error fetching event rules:", error);
    return { success: false, error: "Failed to fetch event rules" };
  }
}

export async function getActiveEventRules() {
  try {
    const eventRules = await db.eventRule.findMany({
      where: {
        isActive: true,
      },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });

    return { success: true, data: eventRules };
  } catch (error) {
    console.error("Error fetching active event rules:", error);
    return { success: false, error: "Failed to fetch active event rules" };
  }
}

export async function getEventRuleById(id: string) {
  try {
    const eventRule = await db.eventRule.findUnique({
      where: { id },
    });

    if (!eventRule) {
      return { success: false, error: "Event rule not found" };
    }

    return { success: true, data: eventRule };
  } catch (error) {
    console.error("Error fetching event rule:", error);
    return { success: false, error: "Failed to fetch event rule" };
  }
}

export async function createEventRule(data: z.infer<typeof eventRuleSchema>) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized access" };
    }

    const validatedData = eventRuleSchema.parse(data);

    const eventRule = await db.eventRule.create({
      data: validatedData,
    });

    revalidatePath("/dashboard/admin/event-rules");
    revalidatePath("/events");

    return { success: true, data: eventRule };
  } catch (error) {
    console.error("Error creating event rule:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: "Invalid data provided" };
    }
    return { success: false, error: "Failed to create event rule" };
  }
}

export async function updateEventRule(
  id: string,
  data: z.infer<typeof eventRuleSchema>
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized access" };
    }

    const validatedData = eventRuleSchema.parse(data);

    const eventRule = await db.eventRule.update({
      where: { id },
      data: validatedData,
    });

    revalidatePath("/dashboard/admin/event-rules");
    revalidatePath("/events");

    return { success: true, data: eventRule };
  } catch (error) {
    console.error("Error updating event rule:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: "Invalid data provided" };
    }
    return { success: false, error: "Failed to update event rule" };
  }
}

export async function deleteEventRule(id: string) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized access" };
    }

    await db.eventRule.delete({
      where: { id },
    });

    revalidatePath("/dashboard/admin/event-rules");
    revalidatePath("/events");

    return { success: true };
  } catch (error) {
    console.error("Error deleting event rule:", error);
    return { success: false, error: "Failed to delete event rule" };
  }
}

export async function toggleEventRuleStatus(id: string) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized access" };
    }

    const eventRule = await db.eventRule.findUnique({
      where: { id },
    });

    if (!eventRule) {
      return { success: false, error: "Event rule not found" };
    }

    const updatedEventRule = await db.eventRule.update({
      where: { id },
      data: { isActive: !eventRule.isActive },
    });

    revalidatePath("/dashboard/admin/event-rules");
    revalidatePath("/events");

    return { success: true, data: updatedEventRule };
  } catch (error) {
    console.error("Error toggling event rule status:", error);
    return { success: false, error: "Failed to toggle event rule status" };
  }
}
